const app = Vue.createApp({
  data() {
    return {
      questions: [],
      userAnswers: [],
      currentIndex: 0,
      examType: null,
      examTitle: '',
      loading: true,
      timer: null,
      timeLeft: 0,
      examSettings: {
        908: { title: '908 考试', file: './questions.json', count: 73, time: 120 * 60 },
        909: { title: '909 考试', file: './909-questions.json', count: 65, time: 90 * 60 }
      }
    };
  },
  computed: {
    formatTime() {
      const minutes = Math.floor(this.timeLeft / 60);
      const seconds = this.timeLeft % 60;
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    },
    currentQuestion() {
      return this.questions[this.currentIndex];
    }
  },
  methods: {
    async initializeExam() {
      const urlParams = new URLSearchParams(window.location.search);
      this.examType = urlParams.get('type');
      const settings = this.examSettings[this.examType];

      if (!settings) {
        alert('无效的考试类型');
        window.location.href = 'index.html';
        return;
      }

      this.examTitle = settings.title;
      this.timeLeft = settings.time;

      const savedState = JSON.parse(localStorage.getItem(`exam_state_${this.examType}`));

      if (savedState) {
        this.questions = savedState.questions;
        this.userAnswers = savedState.userAnswers;
        this.timeLeft = savedState.timeLeft;
        this.currentIndex = savedState.currentIndex;
        this.loading = false;
      } else {
        await this.fetchQuestions(settings.file, settings.count);
        this.userAnswers = Array(this.questions.length).fill([]);
        this.saveState();
      }

      this.startTimer();
    },
    async fetchQuestions(file, count) {
      this.loading = true;
      try {
        const response = await fetch(file);
        const data = await response.json();
        this.questions = this.getRandomQuestions(data, count);
      } catch (error) {
        console.error('加载题目失败:', error);
        alert('加载题目失败，请检查网络连接。');
      }
      this.loading = false;
    },
    getRandomQuestions(allQuestions, count) {
      const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    },
    startTimer() {
      this.timer = setInterval(() => {
        this.timeLeft--;
        this.saveState();
        if (this.timeLeft <= 0) {
          clearInterval(this.timer);
          alert('时间到，考试结束！');
          this.submitExam();
        }
      }, 1000);
    },
    prevQuestion() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.saveState();
      }
    },
    nextQuestion() {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
        this.saveState();
      }
    },
    submitExam() {
      clearInterval(this.timer);
      const examResult = {
        type: this.examType,
        title: this.examTitle,
        date: new Date().toISOString(),
        questions: this.questions,
        userAnswers: this.userAnswers,
        timeSpent: this.examSettings[this.examType].time - this.timeLeft,
      };

      localStorage.setItem('latest_exam_result', JSON.stringify(examResult));
      localStorage.removeItem(`exam_state_${this.examType}`);

      window.location.href = 'result.html';
    },
    saveState() {
      const state = {
        questions: this.questions,
        userAnswers: this.userAnswers,
        timeLeft: this.timeLeft,
        currentIndex: this.currentIndex
      };
      localStorage.setItem(`exam_state_${this.examType}`, JSON.stringify(state));
    },
    renderMarkdown(markdown) {
      return marked.parse(markdown);
    }
  },
  mounted() {
    this.initializeExam();
  },
  beforeUnmount() {
    clearInterval(this.timer);
  }
});

app.mount('#app');