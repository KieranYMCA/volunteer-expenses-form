
let imageCount = 0;

function addImageUpload() {
  if (imageCount >= 25) return;

  const container = document.createElement("div");
  container.className = "upload-group";

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.required = true;

  const textarea = document.createElement("textarea");
  textarea.rows = 2;
  textarea.placeholder = "Description of receipt";

  container.appendChild(document.createElement("hr"));
  container.appendChild(input);
  container.appendChild(textarea);

  document.getElementById("uploads-container").appendChild(container);
  imageCount++;
}

function generatePDF() {
  const name = document.getElementById("name").value;
  const account = document.getElementById("account").value;
  const uploadGroups = document.querySelectorAll(".upload-group");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();
  let y = 10;

  pdf.setFontSize(12);
  pdf.text("YMCA Volunteer Expenses Form", 10, y);
  y += 10;
  pdf.text(`Full Name: ${name}`, 10, y);
  y += 10;
  pdf.text("Bank Account Details:", 10, y);
  y += 10;

  const lines = pdf.splitTextToSize(account, 180);
  pdf.text(lines, 10, y);
  y += lines.length * 10;

  uploadGroups.forEach((group, index) => {
    const fileInput = group.querySelector("input[type='file']");
    const description = group.querySelector("textarea").value;

    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
      if (index > 0 || y > 250) pdf.addPage();

      const img = new Image();
      img.onload = function() {
        let imgWidth = 180;
        let imgHeight = (img.height / img.width) * imgWidth;
        pdf.addImage(img, "JPEG", 10, 20, imgWidth, imgHeight);
        pdf.text("Description:", 10, 20 + imgHeight + 10);
        const descLines = pdf.splitTextToSize(description, 180);
        pdf.text(descLines, 10, 20 + imgHeight + 20);

        if (index === uploadGroups.length - 1) {
          pdf.save("YMCA_Expenses.pdf");
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}
