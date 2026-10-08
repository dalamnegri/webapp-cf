document.getElementById('btn').addEventListener('click', () => {
  document.getElementById('msg').textContent =
    'Deploy OK: ' + new Date().toLocaleString('id-ID');
});
