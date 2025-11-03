document.querySelectorAll('.polaroid').forEach(container => {
  container.addEventListener('click', () => {
    const image = container.querySelector('.polaroidPicture');
    const text = container.querySelector('.polaroidText');
    image.classList.add('hidden');
    text.classList.add('visible');
  });
  container.addEventListener('mouseleave', () => {
    const image = container.querySelector('.polaroidPicture');
    const text = container.querySelector('.polaroidText');
    image.classList.remove('hidden');
    text.classList.remove('visible');
  });
});
document.addEventListener('DOMContentLoaded', () => {
	const polaroids = document.querySelectorAll('.polaroid');
	polaroids.forEach(polaroid => {
		polaroid.addEventListener('click', () => {
			polaroid.classList.toggle('flipped');
		});
		polaroid.addEventListener('mouseleave', () => {
			polaroid.classList.remove('flipped');
		});
	});
	function getRandomTransform() {
		const angle = Math.floor(Math.random() * 10) - 5;
		return `rotate(${angle}deg)`
	}
  	const boxes = document.querySelectorAll('.polaroid');
  	boxes.forEach(box => {
		box.style.transform = getRandomTransform();
	});
});
