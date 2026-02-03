document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const postForm = document.getElementById('post-form');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const activityForm = document.getElementById('activity-form');
  const messageDiv = document.getElementById('auth-message');
  const activitiesList = document.getElementById('activities-list');

  // Initial Load
  loadActivities();
  checkLogin();

  function checkLogin() {
    const token = localStorage.getItem('adip_token');
    if (token) {
      showPostUI();
    } else {
      showLoginUI();
    }
  }

  function showLoginUI() {
    if (loginForm) loginForm.classList.remove('hidden');
    if (postForm) postForm.classList.add('hidden');
  }

  function showPostUI() {
    if (loginForm) loginForm.classList.add('hidden');
    if (postForm) postForm.classList.remove('hidden');
  }

  // Load Activities
  async function loadActivities() {
    try {
      const response = await fetch('http://localhost:3000/api/aktivnosti');
      const data = await response.json();

      if (data.length === 0) {
        activitiesList.innerHTML = '<p>Nema novih aktivnosti.</p>';
        return;
      }

      activitiesList.innerHTML = '';
      data.forEach(item => {
        const div = document.createElement('div');
        div.className = 'activity-item';
        div.style.borderBottom = '1px solid #444';
        div.style.marginBottom = '20px';
        div.style.paddingBottom = '20px';

        div.innerHTML = `
                    <h2 style="color: #27b0ff;">${item.title || 'Bez naslova'}</h2>
                    <small style="color: #888;">${item.date || new Date().toLocaleDateString()}</small>
                    <p>${item.content || ''}</p>
                `;
        activitiesList.appendChild(div);
      });
    } catch (err) {
      console.error(err);
      activitiesList.innerHTML = '<p>Greška pri učitavanju aktivnosti.</p>';
    }
  }

  // Login Handle
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch('http://localhost:3000/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        const data = await response.json();

        if (data.success) {
          localStorage.setItem('adip_token', data.token);
          messageDiv.textContent = 'Uspješna prijava!';
          messageDiv.style.color = 'green';
          showPostUI();
        } else {
          messageDiv.textContent = 'Greška: ' + data.message;
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        console.error(err);
        messageDiv.textContent = 'Greška u komunikaciji.';
      }
    });
  }

  // Logout Handle
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('adip_token');
      checkLogin();
      messageDiv.textContent = 'Odjavljeni ste.';
    });
  }

  // Post Activity Handle
  if (activityForm) {
    activityForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('post-title').value;
      const content = document.getElementById('post-content').value;

      const newActivity = {
        title,
        content,
        date: new Date().toLocaleDateString('hr-HR')
      };

      try {
        const response = await fetch('http://localhost:3000/api/aktivnosti', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newActivity)
        });
        const data = await response.json();

        if (data.success) {
          messageDiv.textContent = 'Aktivnost objavljena!';
          messageDiv.style.color = 'green';
          activityForm.reset();
          loadActivities(); // Reload list
        } else {
          messageDiv.textContent = 'Greška pri objavi.';
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        console.error(err);
        messageDiv.textContent = 'Greška u komunikaciji.';
      }
    });
  }
});
