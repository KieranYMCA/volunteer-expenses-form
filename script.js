
const form = document.getElementById('volunteer-form');
const milesInput = document.getElementById('miles');
const mileageAmount = document.getElementById('mileage-amount');
const totalAmount = document.getElementById('totalAmount');
const receiptUpload = document.getElementById('receiptUpload');
const receiptPreview = document.getElementById('receiptPreview');
let uploadedImages = [];

const MILEAGE_RATE = 0.25;

function updateTotals() {
  const miles = parseFloat(milesInput.value) || 0;
  const mileage = miles * MILEAGE_RATE;
  mileageAmount.value = mileage.toFixed(2);

  const bus = parseFloat(form.busFare?.value) || 0;
  const rail = parseFloat(form.railFare?.value) || 0;
  const air = parseFloat(form.airFare?.value) || 0;
  const sub = parseFloat(form.subsistence?.value) || 0;
  const accom = parseFloat(form.accommodation?.value) || 0;
  const other = parseFloat(form.other?.value) || 0;

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

// Handle receipt uploads
receiptUpload.addEventListener('change', () => {
  uploadedImages = [];
  receiptPreview.innerHTML = "";
  [...receiptUpload.files].forEach(file => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = document.createElement('img');
      img.src = reader.result;
      img.style.maxWidth = "200px";
      img.style.margin = "5px";
      receiptPreview.appendChild(img);
      uploadedImages.push(reader.result);
    };
    reader.readAsDataURL(file);
  });
});

// PDF download with receipts each on a new page
document.getElementById('download-pdf').onclick = async () => {
  const container = document.querySelector('.container').cloneNode(true);
  const canvasCopy = canvas.cloneNode(true);
  canvasCopy.getContext('2d').drawImage(canvas, 0, 0);
  container.querySelector('#signatureCanvas')?.replaceWith(canvasCopy);
  container.querySelector('#receiptPreview')?.remove();

  const opt = {
    margin: 10,
    filename: `YMCA_Volunteer_Expenses_${form.name.value || 'claim'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, scrollY: 0 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    pagebreak: { mode: ['css', 'legacy'] }
  };

  const worker = html2pdf().set(opt).from(container);
  const pdf = await worker.toPdf().get('pdf');

  for (let i = 0; i < uploadedImages.length; i++) {
    pdf.addPage();
    const imgProps = pdf.getImageProperties(uploadedImages[i]);
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let imgWidth = pageWidth - 20;
    let imgHeight = (imgProps.height * imgWidth) / imgProps.width;

    if (imgHeight > pageHeight - 20) {
      imgHeight = pageHeight - 20;
      imgWidth = (imgProps.width * imgHeight) / imgProps.height;
    }

    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;

    pdf.addImage(uploadedImages[i], 'JPEG', x, y, imgWidth, imgHeight);
  }

  pdf.save(opt.filename);
};
