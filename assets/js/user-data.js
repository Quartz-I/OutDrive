(function () {
  const USER_KEY = 'authUser';
  const TOKEN_KEY = 'authToken';

  function getAuthUser() {
    const json = localStorage.getItem(USER_KEY);
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch (err) {
      console.error('Failed to parse auth user:', err);
      return null;
    }
  }

  function setAuthUser(user) {
    if (!user) {
      localStorage.removeItem(USER_KEY);
      return;
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function getAuthToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function signOut() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    window.location.href = 'signin.html';
  }

  function updateText(selector, text) {
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = text;
    });
  }

  function updateAttribute(selector, attribute, value) {
    document.querySelectorAll(selector).forEach((el) => {
      el.setAttribute(attribute, value);
    });
  }

  function getInitials(user) {
    if (!user) return '';
    const first = (user.firstName || '').trim();
    const last = (user.lastName || '').trim();
    return (first.charAt(0) + last.charAt(0)).toUpperCase() || first.charAt(0).toUpperCase();
  }

  function updateUserDetails(user) {
    if (!user) return;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const initials = getInitials(user);

    updateText('.user-avatar, .user-avatar-sm, .sidenav-avatar, .profile-avatar, .hero-avatar', initials);
    updateText('.user-name, .sidenav-name, .profile-hero-name, .hero-name', fullName);
    updateText('.user-email, .profile-hero-email', user.email || '');

    updateAttribute('#fFirst', 'value', user.firstName || '');
    updateAttribute('#fLast', 'value', user.lastName || '');
    updateAttribute('#fEmail', 'value', user.email || '');
    updateAttribute('#fPhone', 'value', user.phone || '');
    updateAttribute('#fDob', 'value', user.dateOfBirth ? user.dateOfBirth.split('T')[0] : '');
    updateAttribute('#fNat', 'value', user.nationality || '');

    updateText('.confirm-email', user.email || '');
  }

  function handleSignInButton(button, user) {
    button.onclick = null;
    if (user) {
      button.textContent = 'Sign Out';
      button.setAttribute('href', '#');
      button.onclick = function (event) {
        event.preventDefault();
        signOut();
      };
    } else {
      button.textContent = 'Sign In';
      button.setAttribute('href', 'signin.html');
    }
  }

  function updateNavigation(user) {
    document.querySelectorAll('.btn-signin').forEach((button) => handleSignInButton(button, user));
    document.querySelectorAll('.btn-signout').forEach((button) => {
      button.onclick = null;
      if (user) {
        button.textContent = 'Sign Out';
        button.onclick = function (event) {
          event.preventDefault();
          signOut();
        };
      } else {
        button.textContent = 'Sign In';
        button.onclick = function (event) {
          event.preventDefault();
          window.location.href = 'signin.html';
        };
      }
    });

    document.querySelectorAll('.btn-booknow').forEach((button) => {
      if (button.dataset.authTarget === 'membership') {
        button.setAttribute('href', user ? 'fleet.html' : 'signup.html');
      } else {
        button.setAttribute('href', user ? 'fleet.html' : 'signin.html');
      }
    });
  }

  function init() {
    const user = getAuthUser();
    updateNavigation(user);
    if (user) {
      updateUserDetails(user);
      if (window.location.pathname.endsWith('/signin.html') || window.location.pathname.endsWith('/signup.html')) {
        window.location.href = 'home.html';
      }
    }
  }

  window.addEventListener('DOMContentLoaded', init);
})();
