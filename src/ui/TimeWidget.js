export default class TimeWidget {
  constructor() {
    this.timeElement = document.getElementById('current-time-widget');
    this.dateElement = document.getElementById('current-date-widget');
    this.widgetElement = document.getElementById('time-widget');
    this.intervalId = null;
    this.is24Hour = true;
    this.lastSecond = -1;
    
    this.setupEventListeners();
    this.start();
  }
  
  setupEventListeners() {
    // Click to toggle 12/24 hour format
    if (this.widgetElement) {
      this.widgetElement.addEventListener('click', () => {
        this.is24Hour = !this.is24Hour;
        this.updateTime();
        
        // Add a little feedback animation
        this.widgetElement.style.transform = 'scale(0.95)';
        setTimeout(() => {
          this.widgetElement.style.transform = '';
        }, 100);
      });
    }
  }
  
  start() {
    // Update immediately
    this.updateTime();
    
    // Update every second
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }
  
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  updateTime() {
    const now = new Date();
    const currentSecond = now.getSeconds();
    
    // Format time based on 12/24 hour preference
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    let timeString;
    if (this.is24Hour) {
      hours = hours.toString().padStart(2, '0');
      timeString = `${hours}:${minutes}:${seconds}`;
    } else {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      timeString = `${hours}:${minutes}:${seconds} ${ampm}`;
    }
    
    // Add pulse effect on second change
    if (currentSecond !== this.lastSecond && this.timeElement) {
      this.timeElement.classList.add('pulse');
      setTimeout(() => {
        this.timeElement.classList.remove('pulse');
      }, 100);
      this.lastSecond = currentSecond;
    }
    
    // Format date as DAY, MON DD
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 
                   'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    
    const dayName = days[now.getDay()];
    const monthName = months[now.getMonth()];
    const date = now.getDate().toString().padStart(2, '0');
    const dateString = `${dayName}, ${monthName} ${date}`;
    
    // Update elements
    if (this.timeElement) {
      this.timeElement.textContent = timeString;
    }
    if (this.dateElement) {
      this.dateElement.textContent = dateString;
    }
  }
}
