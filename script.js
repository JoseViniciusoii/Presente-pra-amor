const config = {
  photosPath: 'assets/photos/',   
  photos: [
  'photo1.jpg',
  'photo2.jpg',
  'photo3.jpg',
  'photo4.jpg',
  'photo5.jpg',
  'photo6.jpg',
  'photo7.jpg',
  'photo8.jpg',
  'photo9.jpg',
  'photo10.jpg',
  'photo11.jpg',
  'photo12.jpg',
  'photo13.jpg',
  'photo14.jpg',
  'photo15.jpg',
  'photo16.jpg',
  'photo17.jpg'
],                     
  characterPlaceholder: 'assets/character/character-placeholder.png',
  musicElemId: 'bg-music',
  reasons: [
    'O seu sorriso ilumina os meus dias.',
    'Ouvir como foi seu dia é a melhor parte do meu dia.',
    'Seu abraço é meu refúgio.',
    'Eu amo te fazer rir.',
    'Você me faz querer ser uma pessoa melhor todos os dias.',
    'Seu carinho me faz sentir único.',
    'Você torna tudo melhor.',
    'Amo nossos momentos, até os mais bestas.',
    'Amo sua risada',
    'Pelo simples fato de te amar.',
    'Você me entende como ninguém.',
    'Amo seu olhar apaixonado.',
    'Você é minha inspiração.',
    'Seu apoio é fundamental pra mim.',
    'Amo planejar o futuro com você.',
    'Você faz meu coração bater mais forte.',
    'Te amo mais a cada dia.',
    'Meu amor por você é infinito.',
    'Por tudo que você é e tudo que faz por mim.'
  ]
};

// estado global
let photoFiles = [];
let currentPhotoIndex = 0;
let lightboxElem = null;
let lightboxImg = null;

document.addEventListener('DOMContentLoaded', () => {
  // Parte de start (overlay) e música (mantive compatibilidade com seu layout)
  const startOverlay = document.getElementById('start-overlay');
  const startBtn = document.getElementById('start-btn');
  const app = document.getElementById('app');
  const music = document.getElementById(config.musicElemId);

  // substitui placeholders do personagem caso existam
  document.querySelectorAll('.character-thumb, .character-small').forEach(img => {
    if(img && img.src && img.src.indexOf('placeholder') !== -1){
      img.src = config.characterPlaceholder;
    }
  });

  const startApp = () => {
    if(startOverlay) startOverlay.classList.add('hide');
    if(app) app.classList.remove('hide');
    if(music){
      music.play().catch(()=>{/* autoplay bloqueado: ok */});
    }
  };
  if(startBtn) startBtn.addEventListener('click', startApp);
  if(startOverlay) startOverlay.addEventListener('click', (e)=>{ if(e.target === startOverlay) startApp(); });

  // inicializações
  try {
    initNav();
    initGallery();
    initCarousel();
    initMusicButton();
  } catch(err) {
    console.error('Erro na inicialização:', err);
  }
});

// NAV (mesmo comportamento)
function initNav(){
  const navButtons = document.querySelectorAll('[data-screen]');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.currentTarget.getAttribute('data-screen');
      showScreen(target);
    });
  });
  showScreen('welcome-screen');
}
function showScreen(id){
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.add('hide'));
  const target = document.getElementById(id);
  if(target) target.classList.remove('hide');
  const main = document.querySelector('.main');
  if(main) main.scrollTop = 0;
}

// GALERIA + LIGHTBOX (robusto)
function initGallery(){
  const grid = document.getElementById('gallery-grid');
  if(!grid){
    console.warn('Elemento #gallery-grid não encontrado no HTML. Verifique seu index.html.');
    return;
  }

  // decide lista de arquivos
  if(Array.isArray(config.photos) && config.photos.length > 0){
    photoFiles = config.photos.slice();
  } else {
    photoFiles = [];
    for(let i=1;i<=config.photoCount;i++) photoFiles.push(`photo${i}.jpg`);
  }

  grid.innerHTML = ''; // limpa
  photoFiles.forEach((filename, idx) => {
    const div = document.createElement('div');
    div.className = 'gallery-item';

    const img = document.createElement('img');
    img.src = `${config.photosPath}${filename}`;
    img.alt = `Foto ${idx+1}`;

    // fallback amigável se arquivo faltar
    img.addEventListener('error', () => {
      img.src = createPlaceholderSVG(idx+1);
      img.style.objectFit = 'contain';
    });

    div.appendChild(img);

    // coração azul
    const heart = document.createElement('div');
    heart.className = 'heart';
    const size = 28 + Math.floor(Math.random()*30);
    heart.style.width = size + 'px';
    heart.style.height = size + 'px';
    heart.style.left = (10 + Math.random()*60) + '%';
    heart.style.top = (10 + Math.random()*60) + '%';
    div.appendChild(heart);

    // abrir lightbox ao clicar na miniatura (usa índice)
    div.addEventListener('click', () => openLightbox(idx));

    grid.appendChild(div);
  });

  // configura lightbox somente se existir no HTML
  lightboxElem = document.getElementById('lightbox');
  lightboxImg = document.getElementById('lightbox-img');
  const closeBtn = document.getElementById('close-lightbox');
  const prevBtn = document.getElementById('lightbox-prev');
  const nextBtn = document.getElementById('lightbox-next');

  if(lightboxElem && lightboxImg){
    if(closeBtn) closeBtn.addEventListener('click', closeLightbox);
    if(prevBtn) prevBtn.addEventListener('click', () => navigateLightbox(-1));
    if(nextBtn) nextBtn.addEventListener('click', () => navigateLightbox(1));
    lightboxElem.addEventListener('click', (e)=> { if(e.target === lightboxElem) closeLightbox(); });

    // teclado
    document.addEventListener('keydown', (e) => {
      if(lightboxElem.classList.contains('hide')) return;
      if(e.key === 'ArrowLeft') navigateLightbox(-1);
      if(e.key === 'ArrowRight') navigateLightbox(1);
      if(e.key === 'Escape') closeLightbox();
    });

    // swipe mobile (simples)
    let startX = null;
    lightboxElem.addEventListener('touchstart', (e) => startX = e.changedTouches[0].clientX);
    lightboxElem.addEventListener('touchend', (e) => {
      if(startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if(dx > 40) navigateLightbox(-1);
      else if(dx < -40) navigateLightbox(1);
      startX = null;
    });
  } else {
    console.warn('Lightbox não encontrado no HTML. Clique nas miniaturas abrirá a imagem em nova aba.');
  }
}

function openLightbox(index){
  currentPhotoIndex = index;
  if(lightboxElem && lightboxImg){
    showLightboxPhoto();
    lightboxElem.classList.remove('hide');
    document.body.style.overflow = 'hidden';
  } else {
    // fallback: abrir em nova aba
    const url = `${config.photosPath}${photoFiles[index]}`;
    window.open(url, '_blank');
  }
}
function closeLightbox(){
  if(!lightboxElem) return;
  lightboxElem.classList.add('hide');
  document.body.style.overflow = '';
}
function navigateLightbox(step){
  if(!photoFiles || photoFiles.length === 0) return;
  currentPhotoIndex = (currentPhotoIndex + step + photoFiles.length) % photoFiles.length;
  showLightboxPhoto();
}
function showLightboxPhoto(){
  if(!lightboxImg) return;
  const file = photoFiles[currentPhotoIndex];
  lightboxImg.src = `${config.photosPath}${file}`;
  lightboxImg.alt = `Foto ${currentPhotoIndex+1}`;
}

// util: SVG placeholder (data URI)
function createPlaceholderSVG(i){
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600'>
    <rect width='100%' height='100%' fill='#eef9ff'/>
    <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='28' fill='#8fbddd'>Foto ${i} — coloque em ${config.photosPath}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/* --- Carousel --- */

function initCarousel() {
  const carousel = document.getElementById('carousel');
  const prev = document.getElementById('prev');
  const next = document.getElementById('next');
  const indicators = document.getElementById('indicators');
  if (!carousel || !prev || !next || !indicators) return;

  // limpa/carrega slides
  carousel.innerHTML = '';
  indicators.innerHTML = '';

  config.reasons.forEach((text, idx) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.dataset.index = idx;
    slide.innerHTML = `<h3>${idx + 1}. ${text}</h3>`;
    carousel.appendChild(slide);

    const dot = document.createElement('div');
    dot.className = 'indicator';
    dot.dataset.index = idx;
    indicators.appendChild(dot);
    dot.addEventListener('click', () => goTo(idx));
  });

  let current = 0;
  const slides = Array.from(carousel.children);
  const total = slides.length;

  function update() {
    slides.forEach((s, i) => {
      s.style.transform = `translateX(${(i - current) * 100}%)`;
    });
    indicators.querySelectorAll('.indicator').forEach((d, i) => {
      d.style.opacity = (i === current) ? '1' : '0.35';
      d.style.background = (i === current) ? 'var(--deep-blue)' : 'rgba(10,30,60,0.12)';
    });
  }
  update();

  function prevSlide() { 
    current = (current - 1 + total) % total; 
    update(); 
  }

  function nextSlide() { 
    current = (current + 1) % total; 
    update(); 
  }

  function goTo(i) { 
    current = i % total; 
    update(); 
  }

  prev.addEventListener('click', prevSlide);
  next.addEventListener('click', nextSlide);

  // swipe mobile
  let startX = null;
  carousel.addEventListener('touchstart', (e) => startX = e.changedTouches[0].clientX);
  carousel.addEventListener('touchend', (e) => {
    if (startX === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 40) prevSlide();
    else if (dx < -40) nextSlide();
    startX = null;
  });

  window.carouselGoTo = goTo;
}

/* --- Música (mesma lógica) --- */
function initMusicButton(){
  const music = document.getElementById(config.musicElemId);
  const toggle = document.getElementById('toggle-music');
  if(!music || !toggle) return;
  updateIcon();
  toggle.addEventListener('click', () => {
    if(music.paused){
      music.play().catch(()=> {
        alert('Toque no botão "Começar" primeiro ou permita reprodução no navegador.');
      });
    } else {
      music.pause();
    }
    updateIcon();
  });
  music.addEventListener('play', updateIcon);
  music.addEventListener('pause', updateIcon);
  function updateIcon(){
    toggle.textContent = music.paused ? '⏵︎' : '⏸︎';
  }
}
