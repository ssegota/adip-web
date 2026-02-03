document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const uploadForm = document.getElementById('upload-form');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const imageUploadForm = document.getElementById('image-upload-form');
  const messageDiv = document.getElementById('auth-message');

  // Check login state
  const token = localStorage.getItem('adip_token');
  if (token) {
    showUploadUI();
  } else {
    showLoginUI();
  }

  function showLoginUI() {
    loginForm.classList.remove('hidden');
    uploadForm.classList.add('hidden');
  }

  function showUploadUI() {
    loginForm.classList.add('hidden');
    uploadForm.classList.remove('hidden');
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
          showUploadUI();
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
      showLoginUI();
      messageDiv.textContent = 'Odjavljeni ste.';
    });
  }

  // Upload Handle
  if (imageUploadForm) {
    imageUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(imageUploadForm);

      try {
        const response = await fetch('http://localhost:3000/api/upload', {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (data.success) {
          messageDiv.textContent = 'Slika uspješno dodana! (Osvježite stranicu za prikaz - TODO: dynamic refresh)';
          messageDiv.style.color = 'green';
          imageUploadForm.reset();
          // In a real app we would append the image to the grid here
        } else {
          messageDiv.textContent = 'Upload failed';
          messageDiv.style.color = 'red';
        }
      } catch (err) {
        console.error(err);
        messageDiv.textContent = 'Greška pri uploadu.';
      }
    });
  }
});
