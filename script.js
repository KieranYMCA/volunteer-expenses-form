
const form = document.getElementById('volunteer-form');
const milesInput = document.getElementById('miles');
const mileageAmount = document.getElementById('mileage-amount');
const totalAmount = document.getElementById('totalAmount');

const MILEAGE_RATE = 0.25;

function updateTotals() {
  const miles = parseFloat(milesInput.value) || 0;
  const mileage = miles * MILEAGE_RATE;
  mileageAmount.value = mileage.toFixed(2);

  const bus = parseFloat(form.busFare.value) || 0;
  const rail = parseFloat(form.railFare.value) || 0;
  const air = parseFloat(form.airFare.value) || 0;
  const sub = parseFloat(form.subsistence.value) || 0;
  const accom = parseFloat(form.accommodation.value) || 0;
  const other = parseFloat(form.other.value) || 0;

  const total = mileage + bus + rail + air + sub + accom + other;
  totalAmount.value = total.toFixed(2);
}

form.addEventListener('input', updateTotals);

// Signature pad
const canvas = document.getElementById('signatureCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

canvas.addEventListener('mousedown', () => (drawing = true));
canvas.addEventListener('mouseup', () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener('mousemove', draw);

function draw(e) {
  if (!drawing) return;
  const rect = canvas.getBoundingClientRect();
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#000';
  ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

document.getElementById('clear-signature').onclick = () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
};

// PDF download
document.getElementById('download-pdf').onclick = () => {
  html2pdf()
    .set({
      margin: 10,
      filename: `YMCA_Volunteer_Expenses_${form.name.value || 'claim'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, scrollY: 0 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(document.querySelector('.container'))
    .save();
};
