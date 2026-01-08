window.addEventListener("load",()=>{document.getElementById("loader").style.display="none";});

function toggleMenu(){document.getElementById("navLinks").classList.toggle("show");}

/* PORTFOLIO FILTER */
function filterPortfolio(category){
document.querySelectorAll(".portfolio-item").forEach(item=>{
item.style.display=(category==="all"||item.classList.contains(category))?"block":"none";
});
}

/* LIGHTBOX */
function openLightbox(el){
document.getElementById("lightbox").style.display="flex";
document.getElementById("lightbox-img").src=el.querySelector("img").src;
}
function closeLightbox(){document.getElementById("lightbox").style.display="none";}

/* TESTIMONIALS */
const testimonials=[
{text:"Kamog Artistry elevated our brand presence beyond expectations.",author:"— Capsada Co. Ltd"},
{text:"Their creativity and professionalism stand out.",author:"— Voltech Engineers"},
{text:"From print to branding, the quality is outstanding.",author:"— MODVA"}
];
let i=0;
function showTestimonial(){
if(document.getElementById("testimonialText")){
testimonialText.innerText=testimonials[i].text;
testimonialAuthor.innerText=testimonials[i].author;
}}
function nextTestimonial(){i=(i+1)%testimonials.length;showTestimonial();}
function prevTestimonial(){i=(i-1+testimonials.length)%testimonials.length;showTestimonial();}
setInterval(nextTestimonial,5000);showTestimonial();
