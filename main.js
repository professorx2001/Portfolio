document.addEventListener('DOMContentLoaded', function() {
    const navBar = document.getElementById('nav_bar');
    navBar.addEventListener('click', function() {
        navBar.classList.toggle('show_menu');
    });
});
