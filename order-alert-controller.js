/* ===== Order Alert Controller Foundation =====
   Phase: ORDER ALERT SYSTEM — IMPLEMENTATION PHASE 1
   Purpose: manage new order alert lifecycle without changing order schema.
*/

(function () {
  const alertCache = new Map();
  const alertQueue = new Map();

  function getOrderId(order) {
    return order && (order.id || order.orderId);
  }

  function detectNewOrder(order) {
    const orderId = getOrderId(order);
    if (!orderId) return false;
    if (alertCache.has(orderId)) return false;

    alertCache.set(orderId, Date.now());
    startOrderAlert(order);
    return true;
  }

  let alertAudio = null;
  let soundEnabled = false;
  let audioInitialized = false;

  function initAlertAudio() {
    if (audioInitialized) return;
    alertAudio = new Audio("sounds/order-alert.mp3");
    alertAudio.loop = true;
    alertAudio.preload = "auto";
    audioInitialized = true;
  }

  function startAlertSound() {
    initAlertAudio();
    if (!soundEnabled || !alertAudio) return;
    alertAudio.play().catch(() => {
      console.warn("Order alert audio requires user interaction");
    });
  }

  function stopAlertSound() {
    if (!alertAudio) return;
    alertAudio.pause();
    alertAudio.currentTime = 0;
  }

  function toggleAlertSound(enabled) {
    soundEnabled = typeof enabled === "boolean" ? enabled : !soundEnabled;
    initAlertAudio();
    if (!soundEnabled) stopAlertSound();
    return soundEnabled;
  }

  function startOrderAlert(order) {
    const orderId = getOrderId(order);
    if (!orderId || alertQueue.has(orderId)) return;

    alertQueue.set(orderId, {
      order,
      startedAt: Date.now()
    });

    startAlertSound();

    if (typeof window.notifyOrder === "function") {
      window.notifyOrder(order);
    }
  }

  function stopOrderAlert(orderId) {
    if (!orderId) return;
    alertQueue.delete(orderId);
    if (alertQueue.size === 0) {
      stopAlertSound();
    }
  }

  function clearAlertQueue() {
    alertQueue.clear();
    alertCache.clear();
  }

  const ALERT_STORAGE_KEY = "sangkha_pending_order_alerts";

  function saveAlertState() {
    localStorage.setItem(ALERT_STORAGE_KEY, JSON.stringify([...alertQueue.keys()]));
  }

  function restoreAlertState() {
    try {
      const saved = JSON.parse(localStorage.getItem(ALERT_STORAGE_KEY) || "[]");
      saved.forEach(id => {
        if (!alertQueue.has(id)) {
          alertQueue.set(id, { restored: true, startedAt: Date.now() });
        }
      });
      if (alertQueue.size) startAlertSound();
    } catch (e) {
      console.warn("Unable to restore order alerts", e);
    }
  }

  function requestNotificationPermission() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }

  function showBrowserNotification(order) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const id = getOrderId(order) || "UNKNOWN";
    new Notification("New Order Received", {
      body: `Order #${id}`
    });
  }

  function vibrateAlert() {
    if (navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate([200, 100, 200]);
    }
  }

  const originalStartOrderAlert = startOrderAlert;
  startOrderAlert = function(order) {
    originalStartOrderAlert(order);
    saveAlertState();
    requestNotificationPermission();
    showBrowserNotification(order);
    vibrateAlert();
  };

  const originalStopOrderAlert = stopOrderAlert;
  stopOrderAlert = function(orderId) {
    originalStopOrderAlert(orderId);
    saveAlertState();
    if (alertQueue.size === 0) {
      localStorage.removeItem(ALERT_STORAGE_KEY);
    }
  };

  restoreAlertState();

  window.OrderAlertController = {
    startOrderAlert,
    stopOrderAlert,
    detectNewOrder,
    clearAlertQueue,
    startAlertSound,
    stopAlertSound,
    toggleAlertSound,
    getPendingAlertCount: () => alertQueue.size,
    isSoundEnabled: () => soundEnabled
  };
})();
