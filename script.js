
const form = document.getElementById('volunteer-form');
const milesInput = document.getElementById('miles');
const mileageAmount = document.getElementById('mileage-amount');
const totalAmount = document.getElementById('totalAmount');
const receiptContainer = document.getElementById('receiptContainer');
const addReceiptBtn = document.getElementById('addReceipt');
const uploadedReceipts = [];

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

// Add receipt upload input with description
addReceiptBtn.addEventListener('click', () => {
  if (document.querySelectorAll('.receipt-block').length >= 25) return;
  const div = document.createElement('div');
  div.className = 'receipt-block';
  div.innerHTML = `
    <input type="file" accept="image/*" class="receipt-img" required />
    <input type="text" placeholder="Description of receipt" class="receipt-desc" />
  `;
  receiptContainer.appendChild(div);
});

// Download PDF
document.getElementById('download-pdf').onclick = async () => {
  const container = document.querySelector('.container').cloneNode(true);
  const canvasCopy = canvas.cloneNode(true);
  canvasCopy.getContext('2d').drawImage(canvas, 0, 0);
  container.querySelector('#signatureCanvas')?.replaceWith(canvasCopy);
  container.querySelector('#receiptContainer')?.remove();

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

  const receipts = document.querySelectorAll('.receipt-block');
  for (const block of receipts) {
    const fileInput = block.querySelector('.receipt-img');
    const desc = block.querySelector('.receipt-desc').value;
    const file = fileInput.files[0];
    if (!file || !file.type.startsWith('image/')) continue;

    const reader = new FileReader();
    await new Promise(resolve => {
      reader.onload = () => {
        pdf.addPage();
        const img = reader.result;
        const imgProps = pdf.getImageProperties(img);
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let imgWidth = pageWidth - 20;
        let imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        if (imgHeight > pageHeight - 40) {
          imgHeight = pageHeight - 40;
          imgWidth = (imgProps.width * imgHeight) / imgProps.height;
        }

        const x = (pageWidth - imgWidth) / 2;
        const y = 20;
        pdf.setFontSize(12);
        pdf.text(`Receipt: ${desc}`, 10, 10);
        pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  pdf.save(opt.filename);
};
