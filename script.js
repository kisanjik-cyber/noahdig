  try {
    const storedDesk = localStorage.getItem("noahDigitalStoresDesk_v1");
    desk = storedDesk ? JSON.parse(storedDesk) : null;
    if (!desk || !Array.isArray(desk.requests) || !Array.isArray(desk.suppliers) || !Array.isArray(desk.transactions)) {
      desk = {
        settings: { name: "Noah Digital Stores", tagline: "Unachokitafuta, tunakutafutia.", area: "Tabora", fee: 5000, phone: "", social: "" },
        requests: [], suppliers: [], transactions: [], payments: [], receipts: [], activity: []
      };
    }
  } catch {
    return { requestNo: "", saved: false };
  }

  const serviceDetails = getServicePaymentDetails(formData.get("service"));
