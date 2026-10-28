if (window.isSecureContext && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', {updateViaCache:'none'})
      .catch(error => console.warn('Gym80: registrácia aplikácie zlyhala.',error));
  });
}
