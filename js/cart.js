const response = await fetch("/api/order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "addOrder",
    timestamp: new Date().toISOString(),
    fullName: currentUser.name,
    accountId: currentUser.id,
    phone: currentUser.phone,
    orderList: orderList,
    totalPrice: total,
    status: "Pending",
  }),
});