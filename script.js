// ============================
// MOMYOUNEEDTHIS INTERACTIONS
// ============================



// Smooth scrolling for buttons //

document.querySelectorAll('a[href^="#"]').forEach(link => {

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






// Fade-in animation when sections appear


const observer = new IntersectionObserver(
(entries)=>{

entries.forEach(entry=>{

if(entry.isIntersecting){

entry.target.classList.add("show");

}

});


},
{
threshold:0.15
}
);




document
.querySelectorAll(
".card, .review-card, .product-card, .favorites, .follow"
)
.forEach(section=>{

observer.observe(section);

});






// Button click effect


document.querySelectorAll(".cta")
.forEach(button=>{


button.addEventListener(
"click",
()=>{

button.style.transform="scale(.96)";


setTimeout(()=>{

button.style.transform="";

},150);


});


});






// Dynamic year in footer


const year = new Date().getFullYear();

const footerText =
document.querySelector("footer p");


if(footerText){

footerText.innerHTML =
`© ${year} MomYouNeedThis`;

}