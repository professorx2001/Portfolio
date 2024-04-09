
//click on navbar icons to get to that section
const navLinks = document.querySelectorAll("#nav_links li a");

  navLinks.forEach(function(link) {
    link.addEventListener("click", function(event) {
      event.preventDefault(); // Prevent default behavior of the anchor link
      
      const targetId = this.getAttribute("href").substring(1);
      const targetSection = document.getElementById(targetId);
      
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      }
    });
  });



  