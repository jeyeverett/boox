let fav = `<svg xmlns="http://www.w3.org/2000/svg" class="custom-fav-icon" x="0px" y="0px" 
width="24" height="24" viewBox="0 0 172 172" style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g fill="#f50009"><path d="M116.50133,21.53583c-19.64383,0.80267 -30.50133,14.9425 -30.50133,14.9425c0,0 -10.8575,-14.13983 -30.50133,-14.9425c-13.17233,-0.5375 -25.24817,6.02 -33.20317,16.5335c-27.67767,36.57867 24.725,79.37083 37.05167,90.859c7.3745,6.87283 16.47617,15.03567 21.9085,19.87317c2.71617,2.42233 6.76533,2.42233 9.4815,0c5.43233,-4.8375 14.534,-13.00033 21.9085,-19.87317c12.32667,-11.48817 64.7365,-54.28033 37.05167,-90.859c-7.94783,-10.5135 -20.02367,-17.071 -33.196,-16.5335z"></path></g></g></svg>`;

let notFav = `<svg xmlns="http://www.w3.org/2000/svg" class="custom-fav-icon" x="0px" y="0px"  
width="24" height="24"  viewBox="0 0 172 172" style=" fill:#000000;"><g fill="none" fill-rule="nonzero" stroke="none" stroke-width="1" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="10" stroke-dasharray="" stroke-dashoffset="0" font-family="none" font-weight="none" font-size="none" text-anchor="none" style="mix-blend-mode: normal"><path d="M0,172v-172h172v172z" fill="none"></path><g fill="#f50009"><path d="M118.25,21.5c-20.7475,0 -32.25,14.97833 -32.25,14.97833c0,0 -11.5025,-14.97833 -32.25,-14.97833c-21.77233,0 -39.41667,17.64433 -39.41667,39.41667c0,29.89217 35.20267,58.85983 45.01383,68.01167c11.30183,10.535 26.65283,24.08 26.65283,24.08c0,0 15.351,-13.545 26.65283,-24.08c9.81117,-9.15183 45.01383,-38.1195 45.01383,-68.01167c0,-21.77233 -17.64433,-39.41667 -39.41667,-39.41667zM106.1455,115.455c-1.2685,1.14667 -2.37217,2.14283 -3.268,2.98133c-5.38217,5.01667 -11.74617,10.7715 -16.8775,15.3725c-5.13133,-4.601 -11.5025,-10.363 -16.8775,-15.3725c-0.903,-0.8385 -2.00667,-1.84183 -3.268,-2.98133c-10.17667,-9.19483 -37.18783,-33.61883 -37.18783,-54.53833c0,-13.83167 11.25167,-25.08333 25.08333,-25.08333c13.0935,0 20.683,9.1375 20.88367,9.374l11.36633,12.126l11.36633,-12.126c0.07167,-0.09317 7.79017,-9.374 20.88367,-9.374c13.83167,0 25.08333,11.25167 25.08333,25.08333c0,20.9195 -27.01117,45.3435 -37.18783,54.53833z"></path></g></g></svg>`;

const favorites = document.querySelectorAll('.custom-fav-button');

favorites.forEach((btn) => {
  btn.addEventListener('click', handleFavorite);
  let id = btn.firstElementChild.value;
  let isFav = favArray.includes(String(id));
  let htmlObj = document.createElement('svg');

  if (isFav) {
    htmlObj.innerHTML = fav;
    btn.appendChild(htmlObj);
  } else {
    htmlObj.innerHTML = notFav;
    btn.appendChild(htmlObj);
  }
});

async function handleFavorite(event) {
  let icon = event.srcElement.closest('.custom-fav-icon');
  let parent = icon.closest('a');
  let bookId = parent.firstElementChild.value;
  let result = await fetch(`http://localhost:3000/favorite/${bookId}`, {
    method: 'POST',
  });

  result = await result.json();
  let htmlObj = document.createElement('svg');

  if (result.message === 'success' && result.removed) {
    htmlObj.innerHTML = notFav;
    parent.removeChild(icon.parentNode);
    parent.appendChild(htmlObj);
  } else if (result.message === 'success' && !result.removed) {
    htmlObj.innerHTML = fav;
    parent.removeChild(icon.parentNode);
    parent.appendChild(htmlObj);
  }
}
