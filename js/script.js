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

function copyLink(){
  navigator.clipboard.writeText(window.location.href)
    .then(()=>alert("Link copied!"));
}

function shareArticle(){
  if(navigator.share){
    navigator.share({
      title: document.title,
      url: window.location.href
    });
  } else {
    copyLink();
    alert("Sharing not supported here — link copied instead.");
  }
}

function likeArticle(){
  const key = "likes_" + window.location.search;
  let count = parseInt(localStorage.getItem(key) || "0", 10);
  count += 1;
  localStorage.setItem(key, count);
  document.getElementById("likeCount").innerText = count;
}

// load like count on page
window.addEventListener("load", ()=>{
  const el = document.getElementById("likeCount");
  if(el){
    const key = "likes_" + window.location.search;
    el.innerText = localStorage.getItem(key) || "0";
  }
});
