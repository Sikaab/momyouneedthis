// Smooth scroll for buttons

document.querySelectorAll("a").forEach(link => {

  link.addEventListener("click", function(e){

    const target = document.querySelector(
      this.getAttribute("href")
    );

    if(target){
      e.preventDefault();

      target.scrollIntoView({
        behavior:"smooth"
      });
    }

  });

});


// Simple scroll animation

const cards = document.querySelectorAll(".card");


const observer = new IntersectionObserver(entries => {

entries.forEach(entry => {

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});

});


cards.forEach(card => {

observer.observe(card);

});