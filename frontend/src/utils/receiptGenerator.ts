import jsPDF from "jspdf";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: string;
  size?: string;
  color?: string;
  product: {
    id: string;
    name: string;
    imageUrl: string;
  };
}

interface OrderDetails {
  id: string;
  total: string;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  shippingAddress: any;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export const generateReceipt = (order: OrderDetails) => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;

  // Clean Color Palette
  const brandBlue: [number, number, number] = [37, 99, 235];
  const lightGray: [number, number, number] = [248, 250, 252];
  const darkGray: [number, number, number] = [71, 85, 105];
  const borderGray: [number, number, number] = [229, 231, 235];

  // Clean header
  pdf.setFillColor(...brandBlue);
  pdf.rect(0, 0, pageWidth, 45, "F");

  // Company name
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont("helvetica", "bold");
  pdf.text("NyambikaAI", 20, 25);

  // Tagline
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("AI-Powered Fashion Experience", 20, 35);

  // Receipt label
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text("RECEIPT", pageWidth - 20, 25, { align: "right" });

  // Status
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(`Status: ${order.status.toUpperCase()}`, pageWidth - 20, 35, {
    align: "right",
  });

  let yPos = 65;

  // Order information section
  pdf.setFillColor(...lightGray);
  pdf.rect(20, yPos, pageWidth - 40, 40, "F");
  pdf.setDrawColor(...borderGray);
  pdf.rect(20, yPos, pageWidth - 40, 40, "S");

  pdf.setTextColor(...darkGray);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text("ORDER INFORMATION", 25, yPos + 10);

  // Order details
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  pdf.text(`Order ID: ${order.id}`, 25, yPos + 20);
  pdf.text(`Date: ${orderDate}`, 25, yPos + 28);
  pdf.text(`Payment: ${order.paymentMethod}`, 25, yPos + 36);

  yPos += 55;

  // Shipping address
  if (order.shippingAddress) {
    const addr =
      typeof order.shippingAddress === "string"
        ? JSON.parse(order.shippingAddress)
        : order.shippingAddress;

    pdf.setFillColor(...lightGray);
    pdf.rect(20, yPos, pageWidth - 40, 35, "F");
    pdf.setDrawColor(...borderGray);
    pdf.rect(20, yPos, pageWidth - 40, 35, "S");

    pdf.setTextColor(...darkGray);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text("DELIVERY ADDRESS", 25, yPos + 10);

    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    let addressY = yPos + 18;
    if (addr.fullName) {
      pdf.text(addr.fullName, 25, addressY);
      addressY += 6;
    }
    if (addr.address || addr.street) {
      pdf.text(addr.address || addr.street, 25, addressY);
      addressY += 6;
    }
    if (addr.city || addr.country) {
      pdf.text(
        `${addr.city || ""}${addr.city && addr.country ? ", " : ""}${
          addr.country || ""
        }`,
        25,
        addressY
      );
    }

    yPos += 50;
  }

  // Items header
  pdf.setFillColor(...brandBlue);
  pdf.rect(20, yPos, pageWidth - 40, 12, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("ITEM", 25, yPos + 8);
  pdf.text("QTY", pageWidth - 100, yPos + 8, { align: "center" });
  pdf.text("PRICE", pageWidth - 70, yPos + 8, { align: "center" });
  pdf.text("TOTAL", pageWidth - 25, yPos + 8, { align: "right" });

  yPos += 12;

  // Items list
  pdf.setTextColor(...darkGray);
  pdf.setFont("helvetica", "normal");

  order.items.forEach((item, index) => {
    const itemTotal = parseFloat(item.price) * item.quantity;

    // Alternate row background
    if (index % 2 === 0) {
      pdf.setFillColor(...lightGray);
      pdf.rect(20, yPos, pageWidth - 40, 18, "F");
    }

    // Item name
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text(item.product.name, 25, yPos + 7);

    // Item details
    if (item.size || item.color) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(107, 114, 128);
      const details = [item.size, item.color].filter(Boolean).join(", ");
      pdf.text(details, 25, yPos + 14);
      pdf.setTextColor(...darkGray);
    }

    // Quantity, price, total
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text(item.quantity.toString(), pageWidth - 100, yPos + 7, {
      align: "center",
    });
    pdf.text(
      `RF ${parseFloat(item.price).toLocaleString()}`,
      pageWidth - 70,
      yPos + 7,
      { align: "center" }
    );

    pdf.setFont("helvetica", "bold");
    pdf.text(`RF ${itemTotal.toLocaleString()}`, pageWidth - 25, yPos + 7, {
      align: "right",
    });

    yPos += 18;
  });

  // Total section
  yPos += 10;

  pdf.setDrawColor(...brandBlue);
  pdf.setLineWidth(1);
  pdf.line(pageWidth - 100, yPos, pageWidth - 20, yPos);

  yPos += 8;

  pdf.setTextColor(...brandBlue);
  pdf.setFontSize(14);
  pdf.setFont("helvetica", "bold");
  pdf.text("TOTAL:", pageWidth - 100, yPos);
  pdf.text(
    `RF ${parseFloat(order.total).toLocaleString()}`,
    pageWidth - 25,
    yPos,
    {
      align: "right",
    }
  );

  yPos += 25;

  // Tracking number
  if (order.trackingNumber) {
    pdf.setFillColor(255, 248, 220);
    pdf.rect(20, yPos, pageWidth - 40, 15, "F");
    pdf.setDrawColor(251, 191, 36);
    pdf.rect(20, yPos, pageWidth - 40, 15, "S");

    pdf.setTextColor(146, 64, 14);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("TRACKING NUMBER:", 25, yPos + 6);
    pdf.text(order.trackingNumber, 25, yPos + 12);

    yPos += 25;
  }

  // Notes
  if (order.notes) {
    pdf.setFillColor(240, 248, 255);
    pdf.rect(20, yPos, pageWidth - 40, 20, "F");
    pdf.setDrawColor(...brandBlue);
    pdf.rect(20, yPos, pageWidth - 40, 20, "S");

    pdf.setTextColor(...brandBlue);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("ORDER NOTES:", 25, yPos + 8);

    pdf.setTextColor(...darkGray);
    pdf.setFont("helvetica", "normal");
    const noteLines = pdf.splitTextToSize(order.notes, pageWidth - 50);
    pdf.text(noteLines, 25, yPos + 14);

    yPos += 30;
  }

  // Footer
  const footerY = pageHeight - 40;

  pdf.setDrawColor(...borderGray);
  pdf.setLineWidth(0.5);
  pdf.line(20, footerY, pageWidth - 20, footerY);

  // Thank you message
  pdf.setTextColor(...brandBlue);
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  pdf.text("Thank you for choosing NyambikaAI!", pageWidth / 2, footerY + 12, {
    align: "center",
  });

  // Contact info
  pdf.setTextColor(...darkGray);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(
    "support@nyambika.com | +1 (555) 123-4567",
    pageWidth / 2,
    footerY + 22,
    { align: "center" }
  );
  pdf.text("www.nyambika.com", pageWidth / 2, footerY + 30, {
    align: "center",
  });

  // Generate filename
  const timestamp = new Date().toISOString().split("T")[0];
  const filename = `NyambikaAI_Receipt_${order.id.slice(-8)}_${timestamp}.pdf`;

  pdf.save(filename);
};
