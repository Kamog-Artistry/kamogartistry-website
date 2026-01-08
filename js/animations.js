const items=document.querySelectorAll(".animate");
const observer=new IntersectionObserver(entries=>{
entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("active")}})
},{threshold:0.2});
items.forEach(i=>observer.observe(i));
