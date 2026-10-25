(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (selector, context) {
    return (context || document).querySelector(selector);
  };
  var $$ = function (selector, context) {
    return Array.prototype.slice.call((context || document).querySelectorAll(selector));
  };

  root.classList.add("js");

  /* ------------------------------------------------------------------ */
  /* Toast                                                              */
  /* ------------------------------------------------------------------ */
  var toastEl = $("#toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toastEl) return;
    window.clearTimeout(toastTimer);
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    toastTimer = window.setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, 2600);
  }

  /* ------------------------------------------------------------------ */
  /* Footer year                                                        */
  /* ------------------------------------------------------------------ */
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------------ */
  /* Reveal on scroll                                                   */
  /* ------------------------------------------------------------------ */
  var revealItems = $$(".reveal");

  if (!("IntersectionObserver" in window) || reduceMotion) {
    revealItems.forEach(function (item) {
      item.classList.add("is-visible");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -36px 0px" }
    );

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Active navigation                                                  */
  /* ------------------------------------------------------------------ */
  var navLinks = $$("[data-nav]");
  var navSections = navLinks
    .map(function (link) {
      return document.getElementById(link.getAttribute("data-nav"));
    })
    .filter(Boolean);

  if ("IntersectionObserver" in window && navSections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          navLinks.forEach(function (link) {
            var isActive = link.getAttribute("data-nav") === entry.target.id;
            link.classList.toggle("is-active", isActive);
            if (isActive) {
              link.setAttribute("aria-current", "page");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-30% 0px -58% 0px", threshold: 0 }
    );

    navSections.forEach(function (section) {
      navObserver.observe(section);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Gentle ID-card tilt                                                */
  /* ------------------------------------------------------------------ */
  var tiltCard = $("[data-tilt]");

  if (tiltCard && finePointer && !reduceMotion) {
    var tiltFrame = null;
    var tiltX = 0;
    var tiltY = 0;

    var applyTilt = function () {
      tiltFrame = null;
      tiltCard.style.setProperty("--rx", tiltX.toFixed(2) + "deg");
      tiltCard.style.setProperty("--ry", tiltY.toFixed(2) + "deg");
    };

    tiltCard.addEventListener("pointermove", function (event) {
      var rect = tiltCard.getBoundingClientRect();
      var px = (event.clientX - rect.left) / rect.width - 0.5;
      var py = (event.clientY - rect.top) / rect.height - 0.5;
      tiltY = px * 8;
      tiltX = py * -8;

      if (!tiltFrame) tiltFrame = window.requestAnimationFrame(applyTilt);
    });

    tiltCard.addEventListener("pointerleave", function () {
      tiltX = 0;
      tiltY = 0;
      if (tiltFrame) {
        window.cancelAnimationFrame(tiltFrame);
        tiltFrame = null;
      }
      tiltCard.style.setProperty("--rx", "0deg");
      tiltCard.style.setProperty("--ry", "0deg");
    });
  }

  /* ------------------------------------------------------------------ */
  /* Copy contact details                                               */
  /* ------------------------------------------------------------------ */
  function legacyCopy(text) {
    var helper = document.createElement("textarea");
    helper.value = text;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.top = "-9999px";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    var ok = false;

    try {
      ok = document.execCommand("copy");
    } catch (error) {
      ok = false;
    }

    document.body.removeChild(helper);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).then(
        function () {
          return true;
        },
        function () {
          return legacyCopy(text);
        }
      );
    }
    return Promise.resolve(legacyCopy(text));
  }

  $$(".copy-button").forEach(function (button) {
    button.addEventListener("click", function () {
      var text = button.getAttribute("data-copy");
      var label = button.getAttribute("data-copy-label") || "内容";
      if (!text) return;

      copyText(text).then(function (ok) {
        showToast(ok ? label + "已复制" : "复制失败，请手动选择");
      });
    });
  });

  /* ------------------------------------------------------------------ */
  /* Animated outcome counters                                          */
  /* ------------------------------------------------------------------ */
  var counters = $$("[data-count]");

  function runCounter(el) {
    var target = Number(el.getAttribute("data-count"));
    var pad = Number(el.getAttribute("data-pad")) || 0;
    var decimals = Number(el.getAttribute("data-decimals")) || 0;
    var duration = 1250;

    if (!Number.isFinite(target)) return;

    if (reduceMotion) {
      el.textContent = decimals
        ? target.toFixed(decimals)
        : String(target).padStart(pad, "0");
      return;
    }

    var start = null;

    function formatCounter(value) {
      return decimals
        ? value.toFixed(decimals)
        : String(Math.round(value)).padStart(pad, "0");
    }

    function tick(now) {
      if (start === null) start = now;
      var progress = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCounter(target * eased);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    el.textContent = decimals ? (0).toFixed(decimals) : "0".padStart(Math.max(pad, 1), "0");
    window.requestAnimationFrame(tick);
  }

  if (counters.length) {
    if (!("IntersectionObserver" in window) || reduceMotion) {
      counters.forEach(runCounter);
    } else {
      var countObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            runCounter(entry.target);
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.55 }
      );

      counters.forEach(function (counter) {
        countObserver.observe(counter);
      });
    }
  }

  /* ------------------------------------------------------------------ */
  /* Radar chart                                                        */
  /* ------------------------------------------------------------------ */
  function RadarChart(canvas, data) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.data = data;
    this.average = Math.round(
      data.reduce(function (total, item) {
        return total + item.value;
      }, 0) / data.length
    );
    this.width = 0;
    this.height = 0;
    this.dpr = 1;
    this.radius = 0;
    this.centerX = 0;
    this.centerY = 0;
    this.progress = 0;
    this.points = [];
    this.hoverIndex = -1;
    this.animationFrame = null;
    this.resizeFrame = null;
    this.hasAnimated = false;

    this.tooltip = $("#radar-tooltip");
    this.bindEvents();
    this.observeResize();
    this.resize();
  }

  RadarChart.prototype.observeResize = function () {
    var self = this;

    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(function () {
        if (self.resizeFrame) return;
        self.resizeFrame = window.requestAnimationFrame(function () {
          self.resizeFrame = null;
          self.resize();
        });
      });
      this.resizeObserver.observe(this.canvas.parentElement);
    } else {
      window.addEventListener("resize", function () {
        self.resize();
      });
    }
  };

  RadarChart.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    this.width = rect.width;
    this.height = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2 + 2;
    this.radius = Math.min(this.width, this.height) * 0.335;

    this.draw();
  };

  RadarChart.prototype.start = function () {
    if (this.hasAnimated) return;
    this.hasAnimated = true;

    if (reduceMotion) {
      this.progress = 1;
      this.draw();
      return;
    }

    var self = this;
    var startTime = null;
    var duration = 1150;

    function animate(now) {
      if (startTime === null) startTime = now;
      var t = Math.min((now - startTime) / duration, 1);
      self.progress = 1 - Math.pow(1 - t, 3);
      self.draw();

      if (t < 1) {
        self.animationFrame = window.requestAnimationFrame(animate);
      }
    }

    this.animationFrame = window.requestAnimationFrame(animate);
  };

  RadarChart.prototype.pointFor = function (index, ratio) {
    var angle = -Math.PI / 2 + (Math.PI * 2 * index) / this.data.length;
    return {
      x: this.centerX + Math.cos(angle) * this.radius * ratio,
      y: this.centerY + Math.sin(angle) * this.radius * ratio,
      angle: angle
    };
  };

  RadarChart.prototype.polygon = function (ratio, close) {
    var ctx = this.ctx;
    var total = this.data.length;

    ctx.beginPath();
    for (var i = 0; i < total; i += 1) {
      var point = this.pointFor(i, ratio);
      if (i === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    }
    if (close !== false) ctx.closePath();
  };

  RadarChart.prototype.draw = function () {
    var ctx = this.ctx;
    var width = this.width;
    var height = this.height;

    if (!width || !height) return;

    ctx.clearRect(0, 0, width, height);

    var labelFont = Math.max(10, Math.min(13, width * 0.024));
    var lineHeight = labelFont * 1.35;
    var labelRadius = this.radius + Math.max(24, width * 0.052);
    var ringSteps = [0.2, 0.4, 0.6, 0.8, 1];
    var i;
    var point;

    /* Soft halo behind the shape */
    var halo = ctx.createRadialGradient(
      this.centerX,
      this.centerY,
      this.radius * 0.08,
      this.centerX,
      this.centerY,
      this.radius * 1.25
    );
    halo.addColorStop(0, "rgba(201, 243, 108, 0.18)");
    halo.addColorStop(0.7, "rgba(201, 243, 108, 0.045)");
    halo.addColorStop(1, "rgba(201, 243, 108, 0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.radius * 1.28, 0, Math.PI * 2);
    ctx.fill();

    /* Grid rings */
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (i = 0; i < ringSteps.length; i += 1) {
      this.polygon(ringSteps[i]);
      ctx.strokeStyle = i === ringSteps.length - 1 ? "rgba(20, 58, 43, 0.22)" : "rgba(20, 58, 43, 0.1)";
      ctx.lineWidth = i === ringSteps.length - 1 ? 1.2 : 1;
      ctx.stroke();
    }

    /* Axes */
    ctx.setLineDash([3, 6]);
    for (i = 0; i < this.data.length; i += 1) {
      point = this.pointFor(i, 1);
      ctx.beginPath();
      ctx.moveTo(this.centerX, this.centerY);
      ctx.lineTo(point.x, point.y);
      ctx.strokeStyle = "rgba(20, 58, 43, 0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.setLineDash([]);

    /* Data polygon */
    var values = this.data.map(function (item) {
      return item.value / 100;
    });

    if (this.progress > 0) {
      var fill = ctx.createRadialGradient(
        this.centerX,
        this.centerY,
        this.radius * 0.05,
        this.centerX,
        this.centerY,
        this.radius
      );
      fill.addColorStop(0, "rgba(201, 243, 108, 0.68)");
      fill.addColorStop(0.68, "rgba(201, 243, 108, 0.36)");
      fill.addColorStop(1, "rgba(30, 90, 67, 0.14)");

      ctx.beginPath();
      for (i = 0; i < values.length; i += 1) {
        point = this.pointFor(i, values[i] * this.progress);
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      }
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.strokeStyle = "rgba(20, 58, 43, 0.72)";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      /* Data points */
      this.points = [];
      for (i = 0; i < values.length; i += 1) {
        point = this.pointFor(i, values[i] * this.progress);
        this.points.push(point);

        if (this.progress < 0.36) continue;

        ctx.beginPath();
        ctx.arc(point.x, point.y, this.hoverIndex === i ? 5.4 : 3.8, 0, Math.PI * 2);
        ctx.fillStyle = this.hoverIndex === i ? "#c9f36c" : "#fffdf7";
        ctx.fill();
        ctx.strokeStyle = "#143a2b";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (this.hoverIndex === i) {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 9, 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(20, 58, 43, 0.2)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    /* Center total */
    if (this.progress > 0.68) {
      var current = this.progress;
      var opacity = Math.min(1, (current - 0.68) / 0.22);
      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#143a2b";
      ctx.font = "600 " + Math.max(19, Math.min(26, width * 0.045)) + 'px "Space Grotesk", sans-serif';
      ctx.fillText(String(this.average), this.centerX, this.centerY - 7);
      ctx.fillStyle = "rgba(20, 58, 43, 0.46)";
      ctx.font = "500 " + Math.max(7.5, Math.min(9, width * 0.016)) + 'px "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.fillText("综合能力", this.centerX, this.centerY + 13);
      ctx.restore();
    }

    /* Axis labels */
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "500 " + labelFont + 'px "PingFang SC", "Microsoft YaHei", sans-serif';

    for (i = 0; i < this.data.length; i += 1) {
      point = this.pointFor(i, 1);
      var angle = point.angle;
      var labelX = this.centerX + Math.cos(angle) * labelRadius;
      var labelY = this.centerY + Math.sin(angle) * labelRadius;
      var lines = this.data[i].lines;
      var isHovered = this.hoverIndex === i;

      ctx.fillStyle = isHovered ? "#143a2b" : "rgba(35, 59, 48, 0.7)";
      for (var lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        var lineY = labelY + (lineIndex - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(lines[lineIndex], labelX, lineY);
      }
    }
  };

  RadarChart.prototype.showTooltip = function (index) {
    if (!this.tooltip || !this.points[index]) return;
    var point = this.points[index];
    var item = this.data[index];

    this.tooltip.textContent = "";
    var label = document.createElement("span");
    label.textContent = item.label;
    var value = document.createElement("strong");
    value.textContent = String(item.value);
    this.tooltip.appendChild(label);
    this.tooltip.appendChild(value);
    this.tooltip.style.left = point.x + "px";
    this.tooltip.style.top = point.y + "px";
    this.tooltip.classList.add("is-visible");
  };

  RadarChart.prototype.hideTooltip = function () {
    if (!this.tooltip) return;
    this.tooltip.classList.remove("is-visible");
  };

  RadarChart.prototype.bindEvents = function () {
    var self = this;
    var pointerTimer = null;

    function pick(event) {
      if (!self.points.length) return -1;

      var rect = self.canvas.getBoundingClientRect();
      var x = event.clientX - rect.left;
      var y = event.clientY - rect.top;
      var closest = -1;
      var minDistance = 24;

      self.points.forEach(function (point, index) {
        var distance = Math.hypot(point.x - x, point.y - y);
        if (distance < minDistance) {
          minDistance = distance;
          closest = index;
        }
      });

      return closest;
    }

    this.canvas.addEventListener("pointermove", function (event) {
      var index = pick(event);
      if (index === self.hoverIndex) {
        if (index >= 0) self.showTooltip(index);
        return;
      }

      self.hoverIndex = index;
      if (index >= 0) {
        self.showTooltip(index);
      } else {
        self.hideTooltip();
      }
      self.draw();
    });

    this.canvas.addEventListener("pointerleave", function () {
      self.hoverIndex = -1;
      self.hideTooltip();
      self.draw();
    });

    this.canvas.addEventListener("pointerdown", function (event) {
      var index = pick(event);
      if (index < 0) return;

      self.hoverIndex = index;
      self.showTooltip(index);
      self.draw();

      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(function () {
        self.hoverIndex = -1;
        self.hideTooltip();
        self.draw();
      }, 2200);
    });

    this.canvas.addEventListener("pointerup", function () {
      window.clearTimeout(pointerTimer);
      pointerTimer = window.setTimeout(function () {
        if (!finePointer) {
          self.hoverIndex = -1;
          self.hideTooltip();
          self.draw();
        }
      }, 1600);
    });
  };

  var radarCanvas = $("#radar-chart");
  var radarData = [
    { label: "数据分析", lines: ["数据", "分析"], value: 72 },
    { label: "SQL 数据库", lines: ["SQL", "数据库"], value: 80 },
    { label: "数智编程", lines: ["数智", "编程"], value: 70 },
    { label: "AI 应用", lines: ["AI", "应用"], value: 74 },
    { label: "经济理解", lines: ["经济", "理解"], value: 72 },
    { label: "学习协作", lines: ["学习", "协作"], value: 85 }
  ];

  if (radarCanvas && radarCanvas.getContext) {
    var radar = new RadarChart(radarCanvas, radarData);

    if (!("IntersectionObserver" in window) || reduceMotion) {
      radar.start();
    } else {
      var radarObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            radar.start();
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.28 }
      );

      radarObserver.observe(radarCanvas.parentElement);
    }

    window.addEventListener("load", function () {
      radar.resize();
    });
  }

  /* ------------------------------------------------------------------ */
  /* Local guestbook                                                    */
  /* ------------------------------------------------------------------ */
  var STORAGE_KEY = "wangle-digital-card-messages-v1";
  var form = $("#message-form");
  var nicknameInput = $("#nickname");
  var messageInput = $("#message-content");
  var nicknameError = $("#nickname-error");
  var messageError = $("#message-error");
  var charCount = $("#char-count");
  var messageList = $("#message-list");
  var messageCount = $("#message-count");
  var submitButton = $("#submit-button");
  var storageAvailable = true;
  var messages = [];

  var avatarColors = ["#c9f36c", "#f0c987", "#b7d8f6", "#f2b4a4", "#d6c8f7", "#b9ddc6"];
  var seedMessages = [
    {
      id: "welcome-note",
      name: "王乐",
      content: "欢迎来到我的数字名片。如果你也在学习数字经济、SQL 或人工智能，欢迎留言交流。",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    }
  ];

  function safeRead() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter(function (item) {
          return (
            item &&
            typeof item.name === "string" &&
            item.name.trim() &&
            typeof item.content === "string" &&
            item.content.trim()
          );
        })
        .slice(0, 60)
        .map(function (item) {
          var parsedTime = new Date(item.createdAt);
          return {
            id: typeof item.id === "string" ? item.id : "note-" + Math.random().toString(36).slice(2),
            name: item.name.trim().slice(0, 20),
            content: item.content.trim().slice(0, 200),
            createdAt: Number.isNaN(parsedTime.getTime()) ? new Date().toISOString() : parsedTime.toISOString()
          };
        });
    } catch (error) {
      storageAvailable = false;
      return null;
    }
  }

  function saveMessages() {
    if (!storageAvailable) return false;

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      return true;
    } catch (error) {
      storageAvailable = false;
      return false;
    }
  }

  function formatRelativeTime(isoString) {
    var time = new Date(isoString).getTime();
    if (Number.isNaN(time)) return "刚刚";

    var diff = Math.max(0, Date.now() - time);
    var minute = 60 * 1000;
    var hour = 60 * minute;
    var day = 24 * hour;

    if (diff < minute) return "刚刚";
    if (diff < hour) return Math.floor(diff / minute) + " 分钟前";
    if (diff < day) return Math.floor(diff / hour) + " 小时前";
    if (diff < day * 7) return Math.floor(diff / day) + " 天前";

    var date = new Date(time);
    return date.getMonth() + 1 + " 月 " + date.getDate() + " 日";
  }

  function avatarColor(name) {
    var total = 0;
    for (var i = 0; i < name.length; i += 1) {
      total += name.charCodeAt(i);
    }
    return avatarColors[total % avatarColors.length];
  }

  function createMessageCard(item, isFresh) {
    var article = document.createElement("article");
    article.className = "message-card" + (isFresh ? " message-card--fresh" : "");
    article.setAttribute("data-message-id", item.id);

    var header = document.createElement("div");
    header.className = "message-head-row";

    var avatar = document.createElement("span");
    avatar.className = "message-avatar";
    avatar.style.setProperty("--avatar-bg", avatarColor(item.name));
    avatar.textContent = item.name.slice(0, 1);
    avatar.setAttribute("aria-hidden", "true");

    var author = document.createElement("div");
    author.className = "message-author";

    var name = document.createElement("strong");
    name.textContent = item.name;

    var time = document.createElement("time");
    time.dateTime = item.createdAt;
    time.textContent = formatRelativeTime(item.createdAt);

    author.appendChild(name);
    author.appendChild(time);
    header.appendChild(avatar);
    header.appendChild(author);

    var content = document.createElement("p");
    content.className = "message-content";
    content.textContent = item.content;

    article.appendChild(header);
    article.appendChild(content);

    return article;
  }

  function updateMessageCount() {
    if (messageCount) messageCount.textContent = messages.length + " 条留言";
  }

  function renderMessages(freshId) {
    if (!messageList) return;

    messageList.textContent = "";

    if (!messages.length) {
      var empty = document.createElement("p");
      empty.className = "message-empty";
      empty.textContent = "还没有留言，来写下第一张吧。";
      messageList.appendChild(empty);
      updateMessageCount();
      return;
    }

    var fragment = document.createDocumentFragment();
    messages.forEach(function (item) {
      fragment.appendChild(createMessageCard(item, item.id === freshId));
    });
    messageList.appendChild(fragment);
    updateMessageCount();
  }

  function loadMessages() {
    var stored = safeRead();

    if (stored === null) {
      messages = seedMessages.map(function (item) {
        return {
          id: item.id,
          name: item.name,
          content: item.content,
          createdAt: item.createdAt
        };
      });
      saveMessages();
    } else {
      messages = stored;
    }

    renderMessages();
  }

  function setFieldError(input, errorElement, message) {
    input.setAttribute("aria-invalid", "true");
    errorElement.textContent = message;
  }

  function clearFieldError(input, errorElement) {
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
  }

  function updateCharacterCount() {
    if (!charCount || !messageInput) return;
    charCount.textContent = messageInput.value.length + " / 200";
  }

  if (form && nicknameInput && messageInput && messageList) {
    loadMessages();
    updateCharacterCount();

    nicknameInput.addEventListener("input", function () {
      clearFieldError(nicknameInput, nicknameError);
    });

    messageInput.addEventListener("input", function () {
      clearFieldError(messageInput, messageError);
      updateCharacterCount();
    });

    messageInput.addEventListener("keydown", function (event) {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var nickname = nicknameInput.value.trim();
      var content = messageInput.value.trim();
      var valid = true;

      clearFieldError(nicknameInput, nicknameError);
      clearFieldError(messageInput, messageError);

      if (!nickname) {
        setFieldError(nicknameInput, nicknameError, "请先留下一个昵称。");
        valid = false;
      }

      if (!content) {
        setFieldError(messageInput, messageError, "留言不能为空，写一句话吧。");
        valid = false;
      } else if (content.length > 200) {
        setFieldError(messageInput, messageError, "留言请控制在 200 字以内。");
        valid = false;
      }

      if (!valid) {
        if (!nickname) {
          nicknameInput.focus();
        } else {
          messageInput.focus();
        }
        return;
      }

      var newMessage = {
        id: "note-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 7),
        name: nickname.slice(0, 20),
        content: content.slice(0, 200),
        createdAt: new Date().toISOString()
      };

      messages.unshift(newMessage);
      messages = messages.slice(0, 60);
      var saved = saveMessages();

      renderMessages(newMessage.id);
      updateMessageCount();

      if (messageList) {
        messageList.scrollTo({
          top: 0,
          behavior: reduceMotion ? "auto" : "smooth"
        });
      }

      form.reset();
      updateCharacterCount();
      clearFieldError(nicknameInput, nicknameError);
      clearFieldError(messageInput, messageError);

      var buttonLabel = submitButton ? submitButton.querySelector("span") : null;
      if (submitButton && buttonLabel) {
        submitButton.disabled = true;
        submitButton.classList.add("is-sent");
        buttonLabel.textContent = "已收到";

        window.setTimeout(function () {
          submitButton.disabled = false;
          submitButton.classList.remove("is-sent");
          buttonLabel.textContent = "发送留言";
        }, 1500);
      }

      showToast(saved ? "留言已写下，谢谢你来到这页。" : "留言已展示，但本地保存不可用。");
    });
  }
})();
