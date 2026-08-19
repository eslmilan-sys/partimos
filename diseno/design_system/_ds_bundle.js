/* @ds-bundle: {"format":4,"namespace":"PartimosDesignSystem_2469fc","components":[{"name":"BanderaField","sourcePath":"components/brand/BanderaField.jsx"},{"name":"Mark","sourcePath":"components/brand/Mark.jsx"},{"name":"Avatar","sourcePath":"components/core/Avatar.jsx"},{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Radio","sourcePath":"components/forms/Radio.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Stepper","sourcePath":"components/forms/Stepper.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"DriverRow","sourcePath":"components/mobility/DriverRow.jsx"},{"name":"RouteStops","sourcePath":"components/mobility/RouteStops.jsx"},{"name":"TripCard","sourcePath":"components/mobility/TripCard.jsx"},{"name":"VehicleChip","sourcePath":"components/mobility/VehicleChip.jsx"},{"name":"TabBar","sourcePath":"components/navigation/TabBar.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/brand/BanderaField.jsx":"13d2cc41e70d","components/brand/Mark.jsx":"14176cf636f0","components/core/Avatar.jsx":"406ccd4b7520","components/core/Badge.jsx":"fb8923be356d","components/core/Button.jsx":"7bdba2f83ef8","components/core/Card.jsx":"8083dbe8a6b1","components/core/IconButton.jsx":"22e8c900e450","components/core/Tag.jsx":"7a2b782506f4","components/feedback/Dialog.jsx":"456d9be8349a","components/feedback/Toast.jsx":"4b4ce311ed6e","components/feedback/Tooltip.jsx":"589d15557fa6","components/forms/Checkbox.jsx":"814ed96f6a34","components/forms/Input.jsx":"42fc1e061fca","components/forms/Radio.jsx":"81da2ba01699","components/forms/Select.jsx":"98ca13e53c30","components/forms/Stepper.jsx":"39315d4a378b","components/forms/Switch.jsx":"fb6dc0de4ea1","components/mobility/DriverRow.jsx":"98b40a21989e","components/mobility/RouteStops.jsx":"fc6ad781fecc","components/mobility/TripCard.jsx":"7267ef269690","components/mobility/VehicleChip.jsx":"f798eb4bd4cc","components/navigation/TabBar.jsx":"d58c49187b5c","components/navigation/Tabs.jsx":"ef31f8a9f637","ui_kits/rider_app/LiveScreen.jsx":"530cc685d3c7","ui_kits/rider_app/ProfileScreen.jsx":"01e4f56ff246","ui_kits/rider_app/ResultsScreen.jsx":"e9ec87776a84","ui_kits/rider_app/SearchScreen.jsx":"bc0032e5499a","ui_kits/rider_app/Shell.jsx":"4f61a07c1d4d","ui_kits/rider_app/TripScreen.jsx":"1d475554ae6c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.PartimosDesignSystem_2469fc = window.PartimosDesignSystem_2469fc || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/BanderaField.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The Bandera field: the red header a primary screen opens with. Oversized headline on a
 * warm red gradient, with the content sheet meant to overlap its lower boundary — the
 * screen archetype for Partimos. `size="s"` is the shorter variant for secondary screens.
 */
function BanderaField({
  eyebrow,
  title,
  titleAccent,
  subtitle,
  trailing,
  size = "lg",
  children,
  style,
  ...rest
}) {
  const h = size === "s" ? "var(--field-h-s)" : "var(--field-h)";
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: h,
      background: "var(--grad-bandera)",
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 var(--gutter-mobile)",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16
    }
  }, eyebrow && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 10.5,
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--track-micro)",
      textTransform: "uppercase",
      color: "var(--field-fg)"
    }
  }, eyebrow), trailing), title && /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: size === "s" ? 30 : 44,
      letterSpacing: "-0.045em",
      lineHeight: 1.02,
      margin: "12px 0 0",
      fontWeight: "var(--weight-regular)",
      color: "var(--white)"
    }
  }, title, titleAccent && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: "var(--weight-semibold)"
    }
  }, titleAccent))), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--field-fg)",
      marginTop: 14,
      letterSpacing: "-0.008em"
    }
  }, subtitle), children));
}
Object.assign(__ds_scope, { BanderaField });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/BanderaField.jsx", error: String((e && e.message) || e) }); }

// components/brand/Mark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const PRESETS = {
  brand: ["var(--rojo-500)", "var(--rojo-200)", "var(--azul-200)", "var(--azul-500)"],
  flag: ["var(--white)", "var(--rojo-500)", "var(--rojo-500)", "var(--white)"],
  rojo: ["var(--rojo-500)", "var(--rojo-300)", "var(--rojo-300)", "var(--rojo-500)"],
  azul: ["var(--azul-500)", "var(--azul-300)", "var(--azul-300)", "var(--azul-500)"],
  ink: ["var(--ink-900)", "var(--ink-300)", "var(--ink-300)", "var(--ink-900)"]
};
function Mark({
  size = 32,
  variant = "brand",
  gap,
  radius,
  wordmark = false,
  style,
  ...rest
}) {
  const quads = PRESETS[variant] || PRESETS.brand;
  const g = gap != null ? gap : Math.max(2, Math.round(size * 0.07));
  const r = radius != null ? radius : Math.max(2, Math.round(size * 0.09));
  const grid = /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      gap: g,
      width: size,
      height: size,
      flex: "none"
    }
  }, quads.map((c, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      background: c,
      borderRadius: r
    }
  })));
  if (!wordmark) return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": "Partimos",
    style: style
  }, rest), grid);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.34,
      ...style
    }
  }, rest), grid, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: size * 0.82,
      letterSpacing: "-0.052em",
      color: "var(--text-primary)",
      lineHeight: 1
    }
  }, "Partimos"));
}
Object.assign(__ds_scope, { Mark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Mark.jsx", error: String((e && e.message) || e) }); }

// components/core/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  xs: 28,
  sm: 36,
  md: 44,
  lg: 56,
  xl: 72
};
const HUES = {
  azul: {
    bg: "var(--azul-100)",
    fg: "var(--azul-700)"
  },
  rojo: {
    bg: "var(--rojo-100)",
    fg: "var(--rojo-700)"
  },
  arena: {
    bg: "var(--arena-100)",
    fg: "var(--arena-700)"
  },
  sand: {
    bg: "var(--sand-200)",
    fg: "var(--ink-700)"
  }
};
/* One hue per person, held stable by name so a driver keeps their colour across screens. */
function hueFor(name) {
  const keys = ["azul", "arena", "sand"];
  let n = 0;
  for (let i = 0; i < (name || "").length; i++) n = (n + name.charCodeAt(i)) % 997;
  return keys[n % keys.length];
}
function Avatar({
  src,
  name = "",
  size = "md",
  shape = "circle",
  hue,
  verified = false,
  ring = false,
  style,
  ...rest
}) {
  const px = sizes[size] || sizes.md;
  const tint = HUES[hue] || HUES[hueFor(name)];
  const radius = shape === "square" ? "var(--radius-square)" : "var(--radius-avatar)";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-block",
      width: px,
      height: px,
      flex: "none",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: px,
      height: px,
      borderRadius: radius,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      background: src ? "var(--sand-200)" : tint.bg,
      color: tint.fg,
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: px * (shape === "square" ? 0.4 : 0.36),
      letterSpacing: "-0.02em",
      boxShadow: ring ? "0 0 0 2px var(--white),0 0 0 4px var(--rojo-500)" : undefined
    }
  }, src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: name,
    style: {
      width: "100%",
      height: "100%",
      objectFit: "cover"
    }
  }) : initials), verified && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -1,
      bottom: -1,
      width: Math.max(14, px * 0.32),
      height: Math.max(14, px * 0.32),
      borderRadius: 999,
      background: "var(--green-500)",
      border: "2px solid var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "60%",
    height: "60%",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.3 4.7 8.5 9.5 3.7"
  }))));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Badge({
  children,
  tone = "neutral",
  size = "md",
  dot = false,
  style,
  ...rest
}) {
  const tones = {
    neutral: {
      background: "var(--sand-200)",
      color: "var(--ink-700)"
    },
    ink: {
      background: "var(--ink-900)",
      color: "var(--white)"
    },
    accent: {
      background: "var(--rojo-500)",
      color: "var(--white)"
    },
    accentSoft: {
      background: "var(--rojo-50)",
      color: "var(--rojo-700)"
    },
    success: {
      background: "var(--green-100)",
      color: "var(--green-700)"
    },
    warning: {
      background: "var(--arena-100)",
      color: "var(--arena-700)"
    },
    danger: {
      background: "var(--red-100)",
      color: "var(--red-700)"
    },
    outline: {
      background: "transparent",
      color: "var(--ink-700)",
      boxShadow: "inset 0 0 0 1px var(--border-default)"
    }
  };
  const sz = size === "sm" ? {
    height: 22,
    fontSize: 11,
    padding: "0 8px"
  } : {
    height: 28,
    fontSize: 12.5,
    padding: "0 11px"
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: "var(--radius-badge)",
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.005em",
      ...sz,
      ...tones[tone],
      ...style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: 999,
      background: "currentColor",
      opacity: .85
    }
  }), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-ui)",
  fontWeight: "var(--weight-semibold)",
  letterSpacing: "-0.01em",
  border: "1px solid transparent",
  borderRadius: "var(--radius-pill)",
  cursor: "pointer",
  transition: "var(--transition-control)",
  whiteSpace: "nowrap",
  textDecoration: "none"
};
const sizes = {
  sm: {
    height: 40,
    padding: "0 18px",
    fontSize: 14
  },
  md: {
    height: 52,
    padding: "0 26px",
    fontSize: 16
  },
  lg: {
    height: 58,
    padding: "0 32px",
    fontSize: 17
  }
};
const variants = {
  primary: {
    background: "var(--action-primary-bg)",
    color: "var(--action-primary-fg)"
  },
  brand: {
    background: "var(--action-brand-bg)",
    color: "var(--action-brand-fg)"
  },
  ink: {
    background: "var(--action-ink-bg)",
    color: "var(--action-ink-fg)"
  },
  secondary: {
    background: "transparent",
    color: "var(--text-primary)",
    borderColor: "var(--border-strong)"
  },
  quiet: {
    background: "var(--action-quiet-bg)",
    color: "var(--text-primary)"
  },
  ghost: {
    background: "transparent",
    color: "var(--text-primary)"
  },
  inverse: {
    background: "var(--white)",
    color: "var(--ink-900)"
  },
  glass: {
    background: "var(--glass-bg-strong)",
    color: "var(--ink-900)",
    backdropFilter: "var(--blur-glass)",
    WebkitBackdropFilter: "var(--blur-glass)",
    border: "var(--glass-border)",
    boxShadow: "var(--glass-highlight),var(--shadow-glass)"
  }
};
const hovers = {
  primary: "var(--action-primary-bg-hover)",
  brand: "var(--action-brand-bg-hover)",
  ink: "var(--action-ink-bg-hover)",
  secondary: "var(--sand-200)",
  quiet: "var(--action-quiet-bg-hover)",
  ghost: "var(--sand-200)",
  inverse: "var(--sand-200)",
  glass: "var(--glass-bg-strong)"
};
function Button({
  children,
  variant = "primary",
  size = "md",
  block = false,
  disabled = false,
  iconLeft,
  iconRight,
  as = "button",
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const Tag = as;
  const v = variants[variant] || variants.primary;
  return /*#__PURE__*/React.createElement(Tag, _extends({
    disabled: Tag === "button" ? disabled : undefined,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      ...base,
      ...(sizes[size] || sizes.md),
      ...v,
      width: block ? "100%" : undefined,
      borderColor: v.borderColor,
      background: hover && !disabled ? hovers[variant] || v.background : v.background,
      transform: press && !disabled ? "scale(var(--press-scale))" : "scale(1)",
      opacity: disabled ? 0.38 : 1,
      pointerEvents: disabled ? "none" : undefined,
      ...style
    }
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  tone = "plain",
  pad = "md",
  radius = "card",
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    plain: {
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-s)"
    },
    hairline: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-subtle)"
    },
    muted: {
      background: "var(--surface-muted)"
    },
    ink: {
      background: "var(--surface-inverse)",
      color: "var(--text-inverse)"
    },
    sunrise: {
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-s)",
      overflow: "hidden",
      position: "relative"
    },
    /* the reference mechanic: light blooms up from the bottom edge, and controls sit ON it */
    bloom: {
      background: "var(--surface-card)",
      boxShadow: "var(--shadow-s)",
      overflow: "hidden",
      position: "relative"
    },
    accent: {
      background: "var(--rojo-50)",
      border: "1px solid var(--rojo-100)"
    },
    brand: {
      background: "var(--surface-brand)",
      color: "var(--text-on-brand)"
    },
    brandDeep: {
      background: "var(--surface-brand-deep)",
      color: "var(--text-on-brand)"
    },
    brandSoft: {
      background: "var(--surface-brand-soft)"
    },
    /* glass needs colour behind it — an azul surface, the gradient, a map, a photo.
       Over the plain sand page it goes grey; use "plain" there instead. */
    glass: {
      background: "var(--glass-bg)",
      backdropFilter: "var(--blur-glass)",
      WebkitBackdropFilter: "var(--blur-glass)",
      border: "var(--glass-border)",
      boxShadow: "var(--glass-highlight),var(--shadow-glass)"
    },
    glassInk: {
      background: "var(--glass-bg-ink)",
      color: "var(--text-inverse)",
      backdropFilter: "var(--blur-glass)",
      WebkitBackdropFilter: "var(--blur-glass)",
      border: "var(--glass-border-ink)",
      boxShadow: "var(--glass-highlight-ink),var(--shadow-glass)"
    }
  };
  const t = tones[tone] || tones.plain;
  const pads = {
    none: 0,
    sm: 16,
    md: "var(--card-pad)",
    lg: "var(--card-pad-l)"
  };
  const radii = {
    card: "var(--radius-card)",
    sheet: "var(--radius-sheet)",
    m: "var(--radius-m)",
    l: "var(--radius-l)",
    tile: "var(--radius-tile)",
    xl: "var(--radius-3xl)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: radii[radius] || radii.card,
      padding: pads[pad],
      ...t,
      transition: "box-shadow var(--dur-base) var(--ease-standard),transform var(--dur-base) var(--ease-standard)",
      cursor: interactive ? "pointer" : undefined,
      boxShadow: interactive && hover ? tone === "glass" || tone === "glassInk" ? "var(--glass-highlight),var(--shadow-glass-l)" : "var(--shadow-m)" : t.boxShadow,
      transform: interactive && hover ? "translateY(-2px)" : "none",
      ...style
    }
  }, rest), tone === "sunrise" && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: "-40% -10% auto -10%",
      height: "160%",
      background: "var(--grad-sunrise)",
      opacity: 0.9,
      filter: "blur(6px)",
      pointerEvents: "none"
    }
  }), tone === "bloom" && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: "-14%",
      right: "-14%",
      bottom: "-52%",
      height: "116%",
      background: "var(--grad-sunrise)",
      filter: "blur(26px)",
      opacity: 0.95,
      pointerEvents: "none"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: tone === "sunrise" || tone === "bloom" ? "relative" : undefined
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const sizes = {
  sm: 36,
  md: 44,
  lg: 52
};
function IconButton({
  children,
  variant = "quiet",
  size = "md",
  label,
  disabled = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const [press, setPress] = React.useState(false);
  const skins = {
    quiet: {
      background: "var(--sand-200)",
      color: "var(--ink-900)",
      hover: "var(--sand-300)"
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-700)",
      hover: "var(--sand-200)"
    },
    outline: {
      background: "var(--white)",
      color: "var(--ink-900)",
      hover: "var(--sand-100)",
      border: "1px solid var(--border-default)"
    },
    ink: {
      background: "var(--ink-900)",
      color: "var(--white)",
      hover: "var(--ink-800)"
    },
    accent: {
      background: "var(--rojo-500)",
      color: "var(--white)",
      hover: "var(--rojo-600)"
    },
    brand: {
      background: "var(--azul-500)",
      color: "var(--white)",
      hover: "var(--azul-600)"
    },
    glass: {
      background: "var(--glass-bg-strong)",
      color: "var(--ink-900)",
      hover: "rgba(255,255,255,.88)",
      backdropFilter: "var(--blur-glass)",
      border: "var(--glass-border)",
      boxShadow: "var(--glass-highlight),var(--shadow-glass)"
    },
    glassInk: {
      background: "var(--glass-bg-ink)",
      color: "var(--white)",
      hover: "rgba(38,35,43,.66)",
      backdropFilter: "var(--blur-glass)",
      border: "var(--glass-border-ink)",
      boxShadow: "var(--glass-highlight-ink),var(--shadow-glass)"
    }
  };
  const s = skins[variant] || skins.quiet;
  return /*#__PURE__*/React.createElement("button", _extends({
    "aria-label": label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => {
      setHover(false);
      setPress(false);
    },
    onMouseDown: () => setPress(true),
    onMouseUp: () => setPress(false),
    style: {
      width: sizes[size] || sizes.md,
      height: sizes[size] || sizes.md,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      borderRadius: "var(--radius-pill)",
      border: s.border || "1px solid transparent",
      background: hover && !disabled ? s.hover : s.background,
      color: s.color,
      backdropFilter: s.backdropFilter,
      WebkitBackdropFilter: s.backdropFilter,
      boxShadow: s.boxShadow,
      cursor: "pointer",
      transition: "var(--transition-control)",
      transform: press && !disabled ? "scale(var(--press-scale))" : "scale(1)",
      opacity: disabled ? 0.38 : 1,
      padding: 0,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const tones = {
  neutral: {
    bg: "var(--white)",
    fg: "var(--ink-700)",
    border: "var(--border-default)",
    dot: "var(--ink-400)"
  },
  azul: {
    bg: "var(--azul-100)",
    fg: "var(--azul-700)",
    border: "transparent",
    dot: "var(--azul-500)"
  },
  rojo: {
    bg: "var(--rojo-100)",
    fg: "var(--rojo-700)",
    border: "transparent",
    dot: "var(--rojo-500)"
  },
  arena: {
    bg: "var(--arena-100)",
    fg: "var(--arena-700)",
    border: "transparent",
    dot: "var(--arena-500)"
  }
};
function Tag({
  children,
  selected = false,
  tone = "neutral",
  icon,
  onClick,
  onRemove,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const t = tones[tone] || tones.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    onClick: onClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 38,
      padding: onRemove ? "0 7px 0 15px" : "0 15px",
      whiteSpace: "nowrap",
      flex: "none",
      borderRadius: "var(--radius-pill)",
      cursor: onClick ? "pointer" : "default",
      transition: "var(--transition-control)",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: "var(--weight-medium)",
      border: `1px solid ${selected ? "var(--rojo-500)" : t.border}`,
      background: selected ? "var(--rojo-50)" : hover && onClick ? "var(--sand-100)" : t.bg,
      color: selected ? "var(--rojo-700)" : t.fg,
      ...style
    }
  }, rest), icon, children, onRemove && /*#__PURE__*/React.createElement("button", {
    "aria-label": "Quitar",
    onClick: e => {
      e.stopPropagation();
      onRemove(e);
    },
    style: {
      width: 22,
      height: 22,
      borderRadius: 999,
      border: "none",
      flex: "none",
      cursor: "pointer",
      background: selected ? "var(--rojo-500)" : t.dot,
      color: "var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "9",
    height: "9",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 3l6 6M9 3l-6 6"
  }))));
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dialog({
  open = true,
  onClose,
  title,
  description,
  children,
  actions,
  variant = "sheet",
  style,
  ...rest
}) {
  if (!open) return null;
  const isSheet = variant === "sheet";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      zIndex: 40,
      display: "flex",
      alignItems: isSheet ? "flex-end" : "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--surface-overlay)",
      backdropFilter: "blur(2px)",
      animation: "none"
    }
  }), /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: "relative",
      width: "100%",
      maxWidth: isSheet ? "none" : 420,
      background: "var(--surface-card)",
      padding: "var(--sheet-pad)",
      borderRadius: isSheet ? "var(--radius-sheet) var(--radius-sheet) 0 0" : "var(--radius-sheet)",
      boxShadow: isSheet ? "var(--shadow-sheet)" : "var(--shadow-l)",
      margin: isSheet ? 0 : 20,
      ...style
    }
  }, rest), isSheet && /*#__PURE__*/React.createElement("div", {
    style: {
      width: 40,
      height: 4,
      borderRadius: 2,
      background: "var(--ink-200)",
      margin: "0 auto 18px"
    }
  }), title && /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: 22,
      letterSpacing: "-0.025em",
      marginBottom: description ? 8 : 16
    }
  }, title), description && /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 15,
      lineHeight: 1.45,
      color: "var(--text-secondary)",
      marginBottom: 18
    }
  }, description), children, actions && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 22
    }
  }, actions)));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Floating pill confirmation. Light by default — a white pill with a hairline reads
 * calmer than a black slab and matches the rest of the system.
 */
function Toast({
  children,
  tone = "light",
  icon,
  action,
  style,
  ...rest
}) {
  const tones = {
    light: {
      background: "rgba(255,255,255,.94)",
      color: "var(--ink-900)",
      border: "1px solid var(--border-subtle)",
      boxShadow: "0 10px 30px -12px rgba(38,35,43,.22)",
      backdropFilter: "var(--blur-glass)",
      WebkitBackdropFilter: "var(--blur-glass)"
    },
    success: {
      background: "var(--green-100)",
      color: "var(--green-700)",
      border: "1px solid transparent"
    },
    danger: {
      background: "var(--rojo-100)",
      color: "var(--rojo-700)",
      border: "1px solid transparent"
    },
    ink: {
      background: "var(--ink-900)",
      color: "var(--white)",
      border: "1px solid transparent"
    }
  };
  const t = tones[tone] || tones.light;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 18px",
      borderRadius: "var(--radius-pill)",
      fontFamily: "var(--font-ui)",
      fontSize: 14.5,
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.01em",
      boxShadow: "var(--shadow-m)",
      ...t,
      ...style
    }
  }, rest), icon, /*#__PURE__*/React.createElement("span", null, children), action && /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .8,
      textDecoration: "underline",
      cursor: "pointer"
    }
  }, action));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  children,
  label,
  placement = "top",
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 8px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    left: {
      right: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)"
    },
    right: {
      left: "calc(100% + 8px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false),
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    }
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      ...pos[placement],
      whiteSpace: "nowrap",
      pointerEvents: "none",
      background: "var(--ink-900)",
      color: "var(--white)",
      padding: "7px 11px",
      borderRadius: "var(--radius-s)",
      fontFamily: "var(--font-ui)",
      fontSize: 12.5,
      fontWeight: "var(--weight-medium)",
      boxShadow: "var(--shadow-m)",
      opacity: show ? 1 : 0,
      transition: "opacity var(--dur-fast) var(--ease-standard)",
      zIndex: 30
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "flex",
      gap: 12,
      alignItems: description ? "flex-start" : "center",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 22,
      height: 22,
      flex: "none",
      borderRadius: 7,
      marginTop: description ? 1 : 0,
      background: checked ? "var(--rojo-500)" : "var(--white)",
      border: `1px solid ${checked ? "var(--rojo-500)" : "var(--border-default)"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "var(--transition-control)"
    }
  }, checked && /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 14 14",
    width: "13",
    height: "13",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 7.3 5.6 9.9 11 4.4"
  }))), /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 15,
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, description)));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  label,
  value,
  onChange,
  placeholder,
  icon,
  suffix,
  hint,
  error,
  type = "text",
  disabled = false,
  size = "md",
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "sm" ? "var(--control-h-s)" : "var(--control-h)";
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-label)",
      color: "var(--text-secondary)",
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      height: h,
      padding: "0 16px",
      background: disabled ? "var(--sand-100)" : "var(--white)",
      borderRadius: "var(--radius-field)",
      border: `1px solid ${error ? "var(--red-500)" : focus ? "var(--border-focus)" : "var(--border-default)"}`,
      boxShadow: focus && !error ? "var(--shadow-focus)" : "none",
      transition: "var(--transition-control)",
      opacity: disabled ? .6 : 1
    }
  }, icon && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      color: "var(--ink-400)"
    }
  }, icon), /*#__PURE__*/React.createElement("input", _extends({
    type: type,
    value: value,
    placeholder: placeholder,
    disabled: disabled,
    onChange: onChange,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      border: "none",
      outline: "none",
      background: "transparent",
      minWidth: 0,
      fontFamily: "var(--font-ui)",
      fontSize: size === "sm" ? 14 : 16,
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      letterSpacing: "-0.01em"
    }
  }, rest)), suffix && /*#__PURE__*/React.createElement("span", {
    style: {
      font: "var(--text-label)",
      color: "var(--text-tertiary)"
    }
  }, suffix)), (hint || error) && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      fontSize: 12.5,
      color: error ? "var(--text-danger)" : "var(--text-tertiary)"
    }
  }, error || hint));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Radio.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Radio({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "flex",
      gap: 12,
      alignItems: description ? "flex-start" : "center",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(true),
    style: {
      width: 22,
      height: 22,
      flex: "none",
      borderRadius: 999,
      marginTop: description ? 1 : 0,
      background: "var(--white)",
      border: `1px solid ${checked ? "var(--rojo-500)" : "var(--border-default)"}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "var(--transition-control)"
    }
  }, checked && /*#__PURE__*/React.createElement("span", {
    style: {
      width: 11,
      height: 11,
      borderRadius: 999,
      background: "var(--rojo-500)"
    }
  })), /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 15,
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, description)));
}
Object.assign(__ds_scope, { Radio });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Radio.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  label,
  value,
  onChange,
  options = [],
  hint,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "block",
      ...style
    }
  }, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      font: "var(--text-label)",
      color: "var(--text-secondary)",
      marginBottom: 7
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      height: "var(--control-h)",
      background: "var(--white)",
      borderRadius: "var(--radius-field)",
      border: `1px solid ${focus ? "var(--border-focus)" : "var(--border-default)"}`,
      boxShadow: focus ? "var(--shadow-focus)" : "none",
      transition: "var(--transition-control)",
      opacity: disabled ? .6 : 1
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange,
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      border: "none",
      outline: "none",
      background: "transparent",
      width: "100%",
      height: "100%",
      padding: "0 44px 0 16px",
      fontFamily: "var(--font-ui)",
      fontSize: 16,
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)",
      letterSpacing: "-0.01em",
      cursor: "pointer"
    }
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 16 16",
    width: "16",
    height: "16",
    fill: "none",
    stroke: "var(--ink-500)",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      position: "absolute",
      right: 16,
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M4 6.5 8 10.5 12 6.5"
  }))), hint && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      fontSize: 12.5,
      color: "var(--text-tertiary)"
    }
  }, hint));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Stepper.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Stepper({
  value = 1,
  onChange,
  min = 0,
  max = 9,
  label,
  unit,
  style,
  ...rest
}) {
  const btn = (dir, disabled, glyph) => /*#__PURE__*/React.createElement("button", {
    disabled: disabled,
    onClick: () => onChange && onChange(Math.min(max, Math.max(min, value + dir))),
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "1px solid var(--border-default)",
      background: "var(--white)",
      color: disabled ? "var(--ink-300)" : "var(--ink-900)",
      cursor: disabled ? "default" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "var(--transition-control)",
      fontSize: 19,
      lineHeight: 1,
      fontWeight: "var(--weight-medium)",
      padding: 0
    }
  }, glyph);
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      ...style
    }
  }, rest), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: "var(--weight-medium)"
    }
  }, label), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, btn(-1, value <= min, "−"), /*#__PURE__*/React.createElement("span", {
    style: {
      minWidth: 34,
      textAlign: "center",
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "-0.02em"
    }
  }, value, unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)",
      marginLeft: 2
    }
  }, unit) : null), btn(1, value >= max, "+")));
}
Object.assign(__ds_scope, { Stepper });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Stepper.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  checked = false,
  onChange,
  label,
  description,
  disabled = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("label", _extends({
    style: {
      display: "flex",
      alignItems: description ? "flex-start" : "center",
      justifyContent: "space-between",
      gap: 16,
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? .5 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, label && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 15,
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, label), description && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 2,
      lineHeight: 1.4
    }
  }, description)), /*#__PURE__*/React.createElement("span", {
    onClick: () => !disabled && onChange && onChange(!checked),
    style: {
      width: 48,
      height: 30,
      flex: "none",
      borderRadius: 999,
      padding: 3,
      background: checked ? "var(--rojo-500)" : "var(--ink-200)",
      transition: "background-color var(--dur-base) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      width: 24,
      height: 24,
      borderRadius: 999,
      background: "var(--white)",
      boxShadow: "var(--shadow-xs)",
      transform: `translateX(${checked ? 18 : 0}px)`,
      transition: "transform var(--dur-base) var(--ease-spring)"
    }
  })));
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/mobility/DriverRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function DriverRow({
  name,
  avatar,
  subtitle,
  rating,
  verified = false,
  meta,
  actions,
  tone = "plain",
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: tone === "plain" ? 0 : 16,
      background: tone === "card" ? "var(--surface-card)" : tone === "muted" ? "var(--surface-muted)" : "transparent",
      borderRadius: tone === "plain" ? 0 : "var(--radius-l)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Avatar, {
    shape: "square",
    size: "lg",
    name: name,
    src: avatar,
    verified: verified
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 17,
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "-0.025em"
    }
  }, name), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-secondary)",
      marginTop: 1
    }
  }, subtitle), (rating != null || meta) && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      marginTop: 4,
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, rating != null && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "12",
    height: "12",
    fill: "var(--star)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 .8 7.5 4h3.4L8.2 6.2l1 3.4L6 7.7 2.8 9.6l1-3.4L1.1 4h3.4z"
  })), rating.toFixed(1)), rating != null && meta && /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-300)"
    }
  }, "\xB7"), meta)), actions);
}
Object.assign(__ds_scope, { DriverRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mobility/DriverRow.jsx", error: String((e && e.message) || e) }); }

// components/mobility/RouteStops.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The route spine: a hairline rail with a dot per stop, time and place on one line.
 * Airy by default; `compact` tightens it for cards.
 */
function RouteStops({
  stops = [],
  compact = false,
  style,
  ...rest
}) {
  const gap = compact ? 15 : 26;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "grid",
      gap,
      ...style
    }
  }, rest), stops.map((s, i) => {
    const last = i === stops.length - 1;
    const active = s.state === "active";
    const done = s.state === "done";
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        display: "flex",
        gap: 13,
        position: "relative"
      }
    }, !last && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 5,
        top: 14,
        bottom: -gap,
        width: 1,
        background: "var(--border-default)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        width: 11,
        height: 11,
        borderRadius: 999,
        flex: "none",
        marginTop: 4,
        position: "relative",
        background: active ? "var(--rojo-500)" : done ? "var(--azul-700)" : "var(--white)",
        boxShadow: active ? "0 0 0 4px var(--rojo-100)" : done ? "none" : "inset 0 0 0 1.5px var(--border-default)"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "baseline",
        gap: 10
      }
    }, s.time && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-data)",
        fontVariantNumeric: "tabular-nums",
        fontSize: compact ? 13.5 : 14.5,
        fontWeight: "var(--weight-medium)",
        color: "var(--text-secondary)",
        flex: "none",
        minWidth: 44
      }
    }, s.time), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: compact ? 15 : 16,
        fontWeight: "var(--weight-medium)",
        letterSpacing: "-0.018em"
      }
    }, s.place)), s.detail && !compact && /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: "var(--text-tertiary)",
        marginTop: 3,
        marginLeft: 54
      }
    }, s.detail)));
  }));
}
Object.assign(__ds_scope, { RouteStops });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mobility/RouteStops.jsx", error: String((e && e.message) || e) }); }

// components/mobility/TripCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TILE = [["var(--azul-100)", "var(--azul-700)"], ["var(--arena-100)", "var(--arena-700)"], ["var(--sand-200)", "var(--ink-700)"]];
function tileFor(name) {
  let n = 0;
  for (let i = 0; i < (name || "").length; i++) n = (n + name.charCodeAt(i)) % 997;
  return TILE[n % TILE.length];
}

/**
 * One trip in a list. Structured on three rows — time band, route, driver — with the
 * price as the loudest element and the seat count as a small rotated pill beside it.
 */
function TripCard({
  trip,
  onClick,
  selected = false,
  style,
  ...rest
}) {
  const {
    from,
    to,
    departAt,
    arriveAt,
    duration,
    price,
    currency = "$",
    driver = {},
    seatsLeft,
    badges = []
  } = trip || {};
  const [bg, fg] = tileFor(driver.name);
  const initials = (driver.name || "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
  const one = seatsLeft === 1;
  const data = {
    fontFamily: "var(--font-data)",
    fontVariantNumeric: "tabular-nums"
  };
  return /*#__PURE__*/React.createElement(__ds_scope.Card, _extends({
    tone: "hairline",
    pad: "md",
    radius: "l",
    interactive: !!onClick,
    onClick: onClick,
    style: {
      boxShadow: selected ? "0 0 0 1.5px var(--rojo-500)" : undefined,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...data,
      fontSize: 13,
      color: "var(--text-secondary)",
      letterSpacing: "0.01em"
    }
  }, departAt, duration ? ` · ${duration}` : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...data,
      fontFamily: "var(--font-display)",
      fontSize: 26,
      fontWeight: "var(--weight-bold)",
      letterSpacing: "-0.04em",
      lineHeight: 0.95
    }
  }, price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: "var(--weight-medium)",
      marginLeft: 2
    }
  }, currency)), seatsLeft != null && /*#__PURE__*/React.createElement("span", {
    style: {
      transform: "rotate(-8deg)",
      background: one ? "var(--rojo-100)" : "var(--azul-100)",
      color: one ? "var(--rojo-700)" : "var(--azul-700)",
      borderRadius: "var(--radius-pill)",
      padding: "3px 8px",
      fontSize: 10.5,
      fontWeight: "var(--weight-semibold)",
      whiteSpace: "nowrap",
      marginTop: 2
    }
  }, seatsLeft, " ", one ? "plaza" : "plazas"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8,
      marginTop: 13
    }
  }, [[from, true], [to, false]].map(([place, isFrom]) => /*#__PURE__*/React.createElement("div", {
    key: place,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 999,
      flex: "none",
      background: isFrom ? "var(--azul-700)" : "var(--white)",
      boxShadow: isFrom ? "none" : "inset 0 0 0 1.5px var(--border-default)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.018em"
    }
  }, place), !isFrom && arriveAt && /*#__PURE__*/React.createElement("span", {
    style: {
      ...data,
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginLeft: "auto"
    }
  }, arriveAt)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0 16px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 36,
      height: 36,
      borderRadius: "var(--radius-square)",
      background: bg,
      color: fg,
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 14,
      letterSpacing: "-0.02em"
    }
  }, initials), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.015em"
    }
  }, driver.name), driver.rating != null && /*#__PURE__*/React.createElement("div", {
    style: {
      ...data,
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "11",
    height: "11",
    fill: "var(--star)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 .8 7.5 4h3.4L8.2 6.2l1 3.4L6 7.7 2.8 9.6l1-3.4L1.1 4h3.4z"
  })), driver.rating.toFixed(1), driver.trips ? ` · ${driver.trips} viajes` : "")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, badges.map(b => /*#__PURE__*/React.createElement(__ds_scope.Badge, {
    key: b.label,
    tone: b.tone || "neutral",
    size: "sm"
  }, b.label)))));
}
Object.assign(__ds_scope, { TripCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mobility/TripCard.jsx", error: String((e && e.message) || e) }); }

// components/mobility/VehicleChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function VehicleChip({
  model,
  plate,
  color,
  seats,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 44,
      height: 44,
      borderRadius: "var(--radius-m)",
      background: "var(--sand-200)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "22",
    height: "22",
    fill: "none",
    stroke: "var(--ink-700)",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M5 14h14M6.5 14 8 8.5h8L17.5 14M4 14v3.5h16V14"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7.5",
    cy: "17.5",
    r: "1.6"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "16.5",
    cy: "17.5",
    r: "1.6"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "-0.015em"
    }
  }, model), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginTop: 2,
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, plate && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-data)",
      fontVariantNumeric: "tabular-nums",
      letterSpacing: "0.02em"
    }
  }, plate), color && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-300)"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, color)), seats != null && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-300)"
    }
  }, "\xB7"), /*#__PURE__*/React.createElement("span", null, seats, " plazas")))));
}
Object.assign(__ds_scope, { VehicleChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/mobility/VehicleChip.jsx", error: String((e && e.message) || e) }); }

// components/navigation/TabBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * App-level bottom navigation. Light by default: off-white with a hairline and a rojo
 * active state. A dark bar with a red pill inside it reads like a games console, not a
 * minimal app, so `tone="ink"` exists only for genuinely dark surfaces (a map at night).
 */
function TabBar({
  items = [],
  value,
  onChange,
  fab,
  tone = "light",
  style,
  ...rest
}) {
  const dark = tone === "ink" || tone === "glass";
  const glass = tone === "glass";
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      height: "var(--tabbar-h)",
      padding: "0 8px",
      position: "relative",
      borderRadius: "var(--radius-pill)",
      background: glass ? "var(--glass-bg-ink)" : dark ? "var(--ink-900)" : "rgba(255,255,255,.86)",
      backdropFilter: "var(--blur-glass)",
      WebkitBackdropFilter: "var(--blur-glass)",
      border: dark ? glass ? "var(--glass-border-ink)" : "1px solid transparent" : "1px solid var(--border-subtle)",
      boxShadow: dark ? "var(--shadow-l)" : "0 10px 30px -12px rgba(38,35,43,.16)",
      ...style
    }
  }, rest), items.map((it, i) => {
    const on = it.value === value;
    const node = /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      "aria-label": it.label,
      style: {
        border: "none",
        background: "none",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "0 12px",
        minWidth: 52,
        color: on ? dark ? "var(--white)" : "var(--rojo-600)" : dark ? "rgba(255,255,255,.56)" : "var(--ink-700)",
        transition: "color var(--dur-fast) var(--ease-standard)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        width: 22,
        height: 22,
        alignItems: "center",
        justifyContent: "center",
        flex: "none"
      }
    }, it.icon), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-ui)",
        fontSize: 10.5,
        fontWeight: on ? "var(--weight-semibold)" : "var(--weight-medium)",
        letterSpacing: "-0.005em"
      }
    }, it.label));
    if (fab && i === Math.ceil(items.length / 2) - 1) {
      return /*#__PURE__*/React.createElement(React.Fragment, {
        key: it.value
      }, node, /*#__PURE__*/React.createElement("button", {
        onClick: fab.onClick,
        "aria-label": fab.label,
        style: {
          width: 46,
          height: 46,
          borderRadius: "var(--radius-square)",
          border: "none",
          background: "var(--rojo-500)",
          color: "var(--white)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 6px 16px -4px rgba(210,16,52,.42)",
          flex: "none"
        }
      }, fab.icon));
    }
    return node;
  }));
}
Object.assign(__ds_scope, { TabBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/TabBar.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  onChange,
  variant = "underline",
  style,
  ...rest
}) {
  if (variant === "segmented") {
    return /*#__PURE__*/React.createElement("div", _extends({
      style: {
        display: "inline-flex",
        background: "var(--sand-200)",
        borderRadius: "var(--radius-pill)",
        padding: 4,
        gap: 2,
        ...style
      }
    }, rest), items.map(it => {
      const on = it.value === value;
      return /*#__PURE__*/React.createElement("button", {
        key: it.value,
        onClick: () => onChange && onChange(it.value),
        style: {
          height: 38,
          padding: "0 18px",
          borderRadius: "var(--radius-pill)",
          border: "none",
          cursor: "pointer",
          background: on ? "var(--white)" : "transparent",
          color: on ? "var(--ink-900)" : "var(--ink-800)",
          fontFamily: "var(--font-ui)",
          fontSize: 14,
          fontWeight: "var(--weight-semibold)",
          letterSpacing: "-0.01em",
          boxShadow: on ? "var(--shadow-xs)" : "none",
          transition: "var(--transition-control)"
        }
      }, it.label);
    }));
  }
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      gap: 26,
      borderBottom: "1px solid var(--border-subtle)",
      ...style
    }
  }, rest), items.map(it => {
    const on = it.value === value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      onClick: () => onChange && onChange(it.value),
      style: {
        position: "relative",
        background: "none",
        border: "none",
        padding: "0 0 13px",
        cursor: "pointer",
        fontFamily: "var(--font-ui)",
        fontSize: 15,
        fontWeight: "var(--weight-semibold)",
        letterSpacing: "-0.01em",
        color: on ? "var(--ink-900)" : "var(--ink-700)",
        transition: "color var(--dur-fast) var(--ease-standard)"
      }
    }, it.label, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: -1,
        height: 2,
        borderRadius: 2,
        background: on ? "var(--rojo-500)" : "transparent",
        transition: "background-color var(--dur-fast) var(--ease-standard)"
      }
    }));
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/LiveScreen.jsx
try { (() => {
const {
  Button,
  Card,
  IconButton,
  Badge,
  DriverRow,
  VehicleChip,
  Toast,
  RouteStops
} = window.PartimosDesignSystem_2469fc;
function LiveScreen({
  trip,
  onEnd
}) {
  const [toast, setToast] = React.useState(true);
  const t = trip || {};
  const d = t.driver || {};
  React.useEffect(() => {
    const id = setTimeout(() => setToast(false), 4200);
    return () => clearTimeout(id);
  }, []);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      background: "var(--surface-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement(MapCanvas, {
    progress: 0.62,
    style: {
      bottom: 300
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 26px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      boxShadow: "0 6px 20px -8px rgba(38,35,43,.18)",
      color: "var(--ink-900)",
      borderRadius: "var(--radius-pill)",
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: 999,
      background: "var(--rojo-500)",
      boxShadow: "0 0 0 4px rgba(210,16,52,.28)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      fontWeight: 600,
      letterSpacing: "-0.015em"
    }
  }, "Llega en 4 min")), /*#__PURE__*/React.createElement(IconButton, {
    variant: "outline",
    label: "Ayuda",
    style: {
      border: "none",
      boxShadow: "0 4px 14px -4px rgba(38,35,43,.22)"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.shield,
    s: 19
  }))), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 108,
      left: 26,
      right: 26,
      zIndex: 4
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "light",
    icon: /*#__PURE__*/React.createElement(I, {
      d: icons.check,
      s: 18
    }),
    action: /*#__PURE__*/React.createElement("span", {
      style: {
        fontWeight: 600
      }
    }, "Ver")
  }, "Plaza confirmada. Luc\xEDa te espera en Albrook.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      background: "var(--surface-card)",
      borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
      boxShadow: "var(--shadow-sheet)",
      padding: "12px 26px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 44,
      height: 4,
      borderRadius: 999,
      background: "var(--ink-200)",
      margin: "0 auto 18px"
    }
  }), /*#__PURE__*/React.createElement(DriverRow, {
    name: d.name || "Lucía Fernández",
    rating: d.rating || 4.9,
    verified: true,
    subtitle: "Va de camino a la recogida",
    actions: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      variant: "quiet",
      label: "Mensaje"
    }, /*#__PURE__*/React.createElement(I, {
      d: icons.chat,
      s: 19
    })), /*#__PURE__*/React.createElement(IconButton, {
      variant: "accent",
      label: "Llamar"
    }, /*#__PURE__*/React.createElement(I, {
      d: icons.phone,
      s: 19
    })))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement(VehicleChip, {
    model: "Toyota Corolla",
    plate: "AV 4821",
    color: "Gris",
    seats: 4
  }), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "sm",
    radius: "l",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(RouteStops, {
    compact: true,
    stops: [{
      place: t.from || "Panamá · Albrook",
      time: t.departAt || "08:00",
      state: "active"
    }, {
      place: t.to || "David · Terminal",
      time: t.arriveAt || "11:45",
      state: "pending"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    block: true,
    onClick: onEnd
  }, "Compartir viaje"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "md",
    block: true,
    style: {
      color: "var(--text-secondary)"
    },
    onClick: onEnd
  }, "Cancelar"))));
}
Object.assign(window, {
  LiveScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/LiveScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/ProfileScreen.jsx
try { (() => {
const {
  Card,
  Avatar,
  Badge,
  Button,
  Switch,
  IconButton
} = window.PartimosDesignSystem_2469fc;
function Row({
  icon,
  label,
  value,
  last
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 13,
      padding: "17px 0",
      borderBottom: last ? "none" : "1px solid var(--border-subtle)",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--radius-square)",
      background: "var(--sand-200)",
      color: "var(--ink-700)",
      flex: "none",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icon,
    s: 18
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 15.5,
      fontWeight: 500,
      letterSpacing: "-0.01em"
    }
  }, label), value && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      color: "var(--text-secondary)"
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-300)"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.chevron,
    s: 17
  })));
}
function ProfileScreen({
  onBack
}) {
  const [alerts, setAlerts] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 200,
      background: "var(--grad-bandera)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    light: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 26px",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "field"
  }, "MIEMBRO DESDE 2021"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 30,
      letterSpacing: "-0.045em",
      lineHeight: 1.06,
      margin: "12px 0 0",
      fontWeight: 400,
      color: "var(--white)"
    }
  }, "Mateo", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "P\xE9rez"))), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Ajustes",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 0,
      background: "rgba(255,255,255,.18)",
      color: "var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.filter,
    s: 19
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 26px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "plain",
    pad: "md",
    radius: "sheet",
    style: {
      marginTop: 28,
      display: "flex",
      alignItems: "center",
      gap: 16,
      boxShadow: "0 18px 40px -18px rgba(120,10,30,.26)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      flex: "none",
      display: "inline-flex",
      width: 72,
      height: 72
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 72,
      height: 72,
      borderRadius: "var(--radius-square)",
      background: "var(--rojo-100)",
      color: "var(--rojo-700)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 29,
      letterSpacing: "-0.02em"
    }
  }, "MP"), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: -3,
      bottom: -3,
      width: 23,
      height: 23,
      borderRadius: 999,
      background: "var(--green-500)",
      border: "2px solid var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "60%",
    height: "60%",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "2.2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2.5 6.3 4.7 8.5 9.5 3.7"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 500,
      letterSpacing: "-0.032em"
    }
  }, "34 viajes \xB7 4.9"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-secondary)",
      marginTop: 3
    }
  }, "Identidad verificada"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    size: "sm",
    dot: true
  }, "Verificado"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    size: "sm"
  }, "Documentos al d\xEDa")))), /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      margin: "30px 0 12px"
    }
  }, "TU IMPACTO"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: 10
    }
  }, [["1 240", "km compartidos"], ["96 kg", "CO₂ ahorrado"], ["182 $", "en gasolina"]].map(([v, l]) => /*#__PURE__*/React.createElement(Card, {
    key: l,
    tone: "hairline",
    pad: "sm",
    radius: "tile",
    style: {
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 700,
      letterSpacing: "-0.035em"
    }
  }, v), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      color: "var(--text-secondary)",
      marginTop: 3,
      lineHeight: 1.25
    }
  }, l)))), /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      margin: "30px 0 12px"
    }
  }, "CUENTA"), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "md",
    radius: "l"
  }, /*#__PURE__*/React.createElement(Row, {
    icon: icons.euro,
    label: "Pagos y cobros",
    value: "Visa \xB7\xB7 4821"
  }), /*#__PURE__*/React.createElement(Row, {
    icon: icons.car,
    label: "Mis veh\xEDculos",
    value: "1"
  }), /*#__PURE__*/React.createElement(Row, {
    icon: icons.shield,
    label: "Documentos",
    value: "Al d\xEDa"
  }), /*#__PURE__*/React.createElement(Row, {
    icon: icons.star,
    label: "Valoraciones",
    value: "21",
    last: true
  })), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "md",
    radius: "l",
    style: {
      marginTop: 12
    }
  }, /*#__PURE__*/React.createElement(Switch, {
    checked: alerts,
    onChange: setAlerts,
    label: "Avisos de plazas",
    description: "Te escribimos cuando alguien publique tu ruta guardada."
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9,
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    block: true
  }, "Invitar a un amigo"), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "md",
    block: true,
    style: {
      color: "var(--text-secondary)"
    },
    onClick: onBack
  }, "Cerrar sesi\xF3n")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 124
    }
  }))));
}
Object.assign(window, {
  ProfileScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/ProfileScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/ResultsScreen.jsx
try { (() => {
const {
  Button,
  Card,
  IconButton,
  Badge
} = window.PartimosDesignSystem_2469fc;

/* Trip row, written locally so the kit renders the current design without waiting
   on a library rebuild. The same structure ships in components/mobility/TripCard.jsx. */
function TripRow({
  trip,
  onClick
}) {
  const {
    from,
    to,
    departAt,
    arriveAt,
    duration,
    price,
    driver = {},
    seatsLeft,
    badges = []
  } = trip || {};
  const one = seatsLeft === 1;
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClick,
    style: {
      background: "var(--white)",
      border: "1px solid var(--border-subtle)",
      borderRadius: "var(--radius-l)",
      padding: 19,
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, departAt, duration ? " · " + duration : ""), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontFamily: "var(--font-display)",
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: "-0.04em",
      lineHeight: .95
    }
  }, price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      marginLeft: 2
    }
  }, "$")), seatsLeft != null && /*#__PURE__*/React.createElement("span", {
    style: {
      transform: "rotate(-8deg)",
      background: one ? "var(--rojo-100)" : "var(--azul-100)",
      color: one ? "var(--rojo-700)" : "var(--azul-700)",
      borderRadius: "var(--radius-pill)",
      padding: "3px 8px",
      fontSize: 10.5,
      fontWeight: 600,
      whiteSpace: "nowrap",
      marginTop: 2
    }
  }, seatsLeft, " ", one ? "plaza" : "plazas"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 8,
      marginTop: 13
    }
  }, [[from, true], [to, false]].map(([place, isFrom]) => /*#__PURE__*/React.createElement("div", {
    key: place,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: 999,
      flex: "none",
      background: isFrom ? "var(--azul-700)" : "var(--white)",
      boxShadow: isFrom ? "none" : "inset 0 0 0 1.5px var(--border-default)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15.5,
      fontWeight: 500,
      letterSpacing: "-0.018em"
    }
  }, place), !isFrom && /*#__PURE__*/React.createElement("span", {
    style: {
      ...DATA,
      fontSize: 13,
      color: "var(--text-tertiary)",
      marginLeft: "auto"
    }
  }, arriveAt)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0 16px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11
    }
  }, /*#__PURE__*/React.createElement(Tile, {
    name: driver.name,
    size: 36
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      fontWeight: 500,
      letterSpacing: "-0.015em"
    }
  }, driver.name), /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      display: "flex",
      alignItems: "center",
      gap: 4,
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "11",
    height: "11",
    fill: "var(--star)"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M6 .8 7.5 4h3.4L8.2 6.2l1 3.4L6 7.7 2.8 9.6l1-3.4L1.1 4h3.4z"
  })), driver.rating != null ? driver.rating.toFixed(1) : "", driver.trips ? ` · ${driver.trips} viajes` : "")), badges.map(b => /*#__PURE__*/React.createElement(Badge, {
    key: b.label,
    tone: b.tone || "neutral",
    size: "sm"
  }, b.label))));
}
const TRIPS = [{
  from: "Panamá · Albrook",
  to: "David · Terminal",
  departAt: "08:00",
  arriveAt: "11:45",
  duration: "3 h 45",
  price: 15,
  seatsLeft: 2,
  driver: {
    name: "Lucía Ferrer",
    rating: 4.9,
    trips: 214,
    verified: true
  },
  badges: [{
    label: "Al instante",
    tone: "accentSoft"
  }]
}, {
  from: "Panamá · Albrook",
  to: "David · Terminal",
  departAt: "08:30",
  arriveAt: "12:20",
  duration: "3 h 50",
  price: 17,
  seatsLeft: 3,
  driver: {
    name: "Andrés Coll",
    rating: 4.7,
    trips: 88
  },
  badges: [{
    label: "Máx. 2 atrás",
    tone: "neutral"
  }]
}, {
  from: "Panamá · Albrook",
  to: "Santiago",
  departAt: "10:15",
  arriveAt: "14:05",
  duration: "3 h 50",
  price: 14,
  seatsLeft: 1,
  driver: {
    name: "Nerea Solís",
    rating: 5.0,
    trips: 41,
    verified: true
  },
  badges: []
}, {
  from: "Panamá · SJ Centennial",
  to: "David · Terminal",
  departAt: "13:00",
  arriveAt: "16:40",
  duration: "3 h 40",
  price: 19,
  seatsLeft: 2,
  driver: {
    name: "Pau Ribas",
    rating: 4.8,
    trips: 132
  },
  badges: [{
    label: "Al instante",
    tone: "accentSoft"
  }]
}];
function ResultsScreen({
  onBack,
  onOpen
}) {
  const [filter, setFilter] = React.useState("todos");
  const filters = [["todos", "Todos"], ["instant", "Al instante"], ["max2", "Máx. 2 atrás"], ["verif", "Verificados"]];
  const [applied, setApplied] = React.useState(["Al instante", "Verificados"]);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 214,
      background: "var(--grad-bandera)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    light: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 26px 30px",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: onBack,
    "aria-label": "Volver",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 0,
      background: "rgba(255,255,255,.18)",
      color: "var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.back,
    s: 20
  })), /*#__PURE__*/React.createElement("button", {
    "aria-label": "Filtros",
    style: {
      width: 40,
      height: 40,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 0,
      background: "rgba(255,255,255,.18)",
      color: "var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.filter,
    s: 19
  }))), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 30,
      letterSpacing: "-0.045em",
      lineHeight: 1.06,
      margin: "14px 0 0",
      fontWeight: 400,
      color: "var(--white)"
    }
  }, "Panam\xE1", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "\u2192 David")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontSize: 14,
      color: "var(--field-fg)",
      marginTop: 10
    }
  }, "S\xE1b 14 jun \xB7 1 plaza \xB7 ", TRIPS.length, " viajes")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      gap: 8,
      padding: "0 26px 4px",
      overflowX: "auto"
    }
  }, filters.map(([v, l]) => {
    const on = filter === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => setFilter(v),
      style: {
        height: 36,
        padding: "0 15px",
        borderRadius: "var(--radius-pill)",
        cursor: "pointer",
        flex: "none",
        border: on ? "1px solid var(--rojo-500)" : "1px solid var(--border-default)",
        background: on ? "var(--rojo-50)" : "var(--white)",
        color: on ? "var(--rojo-700)" : "var(--ink-700)",
        boxShadow: "var(--shadow-xs)",
        fontSize: 13.5,
        fontWeight: 500,
        letterSpacing: "-0.012em"
      }
    }, l);
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      overflowY: "auto",
      padding: "24px 26px 0"
    }
  }, applied.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginBottom: 24
    }
  }, applied.map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 34,
      padding: "0 5px 0 13px",
      borderRadius: "var(--radius-pill)",
      background: "var(--azul-100)",
      color: "var(--azul-700)",
      fontSize: 13,
      fontWeight: 500
    }
  }, c, /*#__PURE__*/React.createElement("button", {
    "aria-label": "Quitar " + c,
    onClick: () => setApplied(applied.filter(x => x !== c)),
    style: {
      width: 21,
      height: 21,
      borderRadius: 999,
      border: "none",
      cursor: "pointer",
      padding: 0,
      background: "var(--azul-500)",
      color: "var(--white)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 12 12",
    width: "9",
    height: "9",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M3 3l6 6M9 3l-6 6"
  })))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "SALIDAS DE LA MA\xD1ANA"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-secondary)"
    }
  }, "m\xE1s temprano primero")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, TRIPS.slice(0, 3).map((t, i) => /*#__PURE__*/React.createElement(TripRow, {
    key: i,
    trip: t,
    onClick: () => onOpen(t)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      margin: "34px 0 14px"
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "SALIDAS DE LA TARDE")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 10
    }
  }, TRIPS.slice(3).map((t, i) => /*#__PURE__*/React.createElement(TripRow, {
    key: i,
    trip: t,
    onClick: () => onOpen(t)
  }))), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "md",
    style: {
      marginTop: 30
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "rojo",
    style: {
      marginBottom: 8
    }
  }, "NADA A TU HORA"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontSize: 14,
      color: "var(--text-secondary)",
      lineHeight: 1.45,
      marginBottom: 14
    }
  }, "Av\xEDsanos y te escribimos en cuanto alguien publique esta ruta."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "md",
    block: true
  }, "Avisarme"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    block: true
  }, "Cambiar la fecha"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 30
    }
  })));
}
Object.assign(window, {
  ResultsScreen,
  TRIPS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/ResultsScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/SearchScreen.jsx
try { (() => {
const {
  Button,
  Card,
  IconButton
} = window.PartimosDesignSystem_2469fc;
const Mark = ({
  size = 24,
  flag = false
}) => /*#__PURE__*/React.createElement("span", {
  style: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gridTemplateRows: "1fr 1fr",
    gap: 2,
    width: size,
    height: size,
    flex: "none"
  }
}, (flag ? ["#fff", "rgba(255,255,255,.5)", "rgba(255,255,255,.5)", "#fff"] : ["var(--white)", "var(--rojo-500)", "var(--azul-500)", "var(--white)"]).map((c, i) => /*#__PURE__*/React.createElement("span", {
  key: i,
  style: {
    background: c,
    borderRadius: 2,
    boxShadow: !flag && c === "var(--white)" ? "inset 0 0 0 1px var(--border-subtle)" : undefined
  }
})));
const Eyebrow = ({
  children,
  tone = "quiet",
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    fontSize: 10.5,
    fontWeight: 600,
    letterSpacing: "var(--track-micro)",
    textTransform: "uppercase",
    color: tone === "field" ? "var(--field-fg)" : tone === "rojo" ? "var(--rojo-600)" : "var(--text-tertiary)",
    ...style
  }
}, children);
const DATA = {
  fontFamily: "var(--font-data)",
  fontVariantNumeric: "tabular-nums"
};

/* The route line, threading a set of points. Solid where the journey has happened,
   hollow where it hasn't — the gesture carried over from direction C. */
const RouteLine = ({
  stops,
  style
}) => /*#__PURE__*/React.createElement("div", {
  style: {
    display: "grid",
    gap: 2,
    ...style
  }
}, stops.map((s, i) => {
  const last = i === stops.length - 1;
  return /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      gap: 14,
      position: "relative",
      padding: "12px 0"
    }
  }, !last && /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 4.5,
      top: 26,
      bottom: -4,
      width: 1.5,
      background: s.done ? "var(--rojo-300)" : "var(--border-default)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      height: 10,
      borderRadius: 999,
      flex: "none",
      marginTop: 6,
      boxSizing: "border-box",
      background: s.done ? "var(--rojo-500)" : "var(--white)",
      border: s.done ? "none" : "2px solid var(--ink-200)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      alignItems: "baseline",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      letterSpacing: "-0.018em",
      flex: 1
    }
  }, s.place), s.meta && /*#__PURE__*/React.createElement("span", {
    style: {
      ...DATA,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, s.meta)));
}));
function SearchScreen({
  onSearch
}) {
  const [tab, setTab] = React.useState("voy");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      background: "var(--surface-page)",
      overflow: "hidden",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 326,
      background: "var(--grad-bandera)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, {
    light: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 26px",
      color: "var(--white)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    tone: "field"
  }, "S\xC1BADO 14 JUNIO"), /*#__PURE__*/React.createElement(Mark, {
    size: 24,
    flag: true
  })), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 44,
      letterSpacing: "-0.045em",
      lineHeight: 1.02,
      margin: "12px 0 0",
      fontWeight: 400,
      color: "var(--white)"
    }
  }, "Hola,", /*#__PURE__*/React.createElement("br", null), /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "Mateo")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      color: "var(--field-fg)",
      marginTop: 14,
      letterSpacing: "-0.008em"
    }
  }, "Tienes un viaje ma\xF1ana a las 08:00.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      margin: "34px 22px 0",
      background: "var(--white)",
      borderRadius: "var(--radius-sheet)",
      padding: 22,
      boxShadow: "0 18px 40px -18px rgba(120,10,30,.28)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 400,
      letterSpacing: "-0.035em",
      lineHeight: 1.26
    }
  }, "Panam\xE1", /*#__PURE__*/React.createElement("br", null), "\u2192 ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "David")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontSize: 13,
      color: "var(--text-secondary)",
      marginTop: 9
    }
  }, "S\xE1b 08:00 \xB7 3 h 45 \xB7 Luc\xEDa F.")), /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontSize: 24,
      fontWeight: 500,
      letterSpacing: "-0.04em",
      whiteSpace: "nowrap"
    }
  }, "15", /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 400,
      color: "var(--text-secondary)",
      marginLeft: 2
    }
  }, "$"))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "20px 0 8px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 2,
      padding: 4,
      marginBottom: 8,
      borderRadius: "var(--radius-pill)",
      background: "var(--sand-200)"
    }
  }, [["voy", "Voy de pasajero"], ["conduzco", "Conduzco"]].map(([v, l]) => {
    const on = tab === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      onClick: () => setTab(v),
      style: {
        flex: 1,
        height: 36,
        borderRadius: "var(--radius-pill)",
        border: "none",
        cursor: "pointer",
        background: on ? "var(--white)" : "transparent",
        color: on ? "var(--ink-900)" : "var(--ink-800)",
        fontFamily: "var(--font-ui)",
        fontSize: 13.5,
        fontWeight: 500,
        letterSpacing: "-0.012em",
        boxShadow: on ? "var(--shadow-xs)" : "none",
        transition: "var(--transition-control)"
      }
    }, l);
  })), /*#__PURE__*/React.createElement(RouteLine, {
    stops: [{
      place: "Panamá · Albrook",
      done: true
    }, {
      place: "David · Terminal"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      paddingTop: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 10,
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      ...DATA,
      flex: 1,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, "Hoy, 08:00"), /*#__PURE__*/React.createElement("span", {
    style: {
      ...DATA,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, "1 plaza")), /*#__PURE__*/React.createElement(Button, {
    variant: "brand",
    size: "lg",
    block: true,
    style: {
      marginTop: 18
    },
    onClick: onSearch
  }, "Buscar viajes")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "34px 26px 0"
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, {
    style: {
      marginBottom: 14
    }
  }, "GANA CON TU COCHE"), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      overflow: "hidden",
      borderRadius: "var(--radius-l)",
      padding: 22,
      minHeight: 132
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "var(--grad-sunrise)",
      filter: "blur(20px)",
      transform: "scale(1.2)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...DATA,
      fontSize: 34,
      fontWeight: 500,
      letterSpacing: "-0.045em",
      lineHeight: 1
    }
  }, "182 $"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      letterSpacing: "-0.03em",
      marginTop: 10,
      maxWidth: 220,
      fontWeight: 400,
      lineHeight: 1.3
    }
  }, "Publica tu viaje y ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 600
    }
  }, "cubre la gasolina")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "inverse",
    size: "sm"
  }, "Empezar"))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "34px 26px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "baseline",
      marginBottom: 6
    }
  }, /*#__PURE__*/React.createElement(Eyebrow, null, "RUTAS GUARDADAS"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      color: "var(--text-tertiary)"
    }
  }, "Editar")), [["David", "desde 15 $"], ["Boquete", "desde 18 $"], ["Chitré", "desde 12 $"]].map(([b, p], i, a) => /*#__PURE__*/React.createElement("div", {
    key: b,
    onClick: onSearch,
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 14,
      padding: "15px 0",
      cursor: "pointer",
      borderBottom: i === a.length - 1 ? "none" : "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      fontSize: 17,
      letterSpacing: "-0.02em",
      fontWeight: 400
    }
  }, "Panam\xE1 \u2192 ", /*#__PURE__*/React.createElement("b", {
    style: {
      fontWeight: 500
    }
  }, b)), /*#__PURE__*/React.createElement("span", {
    style: {
      ...DATA,
      fontSize: 13.5,
      color: "var(--text-secondary)"
    }
  }, p)))), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 124
    }
  })));
}
Object.assign(window, {
  SearchScreen,
  Eyebrow,
  Mark,
  RouteLine,
  DATA
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/SearchScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/Shell.jsx
try { (() => {
const {
  IconButton
} = window.PartimosDesignSystem_2469fc;
const I = ({
  d,
  s = 20,
  w = 1.7
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 24 24",
  width: s,
  height: s,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: w,
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, d.map((p, i) => /*#__PURE__*/React.createElement("path", {
  key: i,
  d: p
})));
const icons = {
  home: ["M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"],
  car: ["M5 14h14M6.5 14 8 8.5h8L17.5 14M4 14v4h16v-4", "M7.5 17.5h.01M16.5 17.5h.01"],
  chat: ["M21 12a8 8 0 1 1-3.2-6.4M21 12c0 4.4-4 8-9 8a10 10 0 0 1-3-.4L4 21l1.4-3.6"],
  user: ["M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0"],
  plus: ["M12 5v14M5 12h14"],
  back: ["M15 18l-6-6 6-6"],
  pin: ["M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z", "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"],
  dot: ["M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
  clock: ["M12 7v5l3 2", "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"],
  seat: ["M7 4h6a3 3 0 0 1 3 3v7H7z", "M5 14h14v6"],
  swap: ["M7 4v13M7 4 4 7M7 4l3 3", "M17 20V7M17 20l3-3M17 20l-3-3"],
  filter: ["M4 6h16M7 12h10M10 18h4"],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3"],
  star: ["M12 3.5l2.6 5.4 5.9.7-4.3 4 1.1 5.9L12 16.6 6.7 19.5l1.1-5.9-4.3-4 5.9-.7z"],
  shield: ["M12 21s7-3.5 7-9V6l-7-3-7 3v6c0 5.5 7 9 7 9Z", "M9.5 12l1.8 1.8 3.4-3.6"],
  phone: ["M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z"],
  share: ["M12 15V4M8.5 7.5 12 4l3.5 3.5", "M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5"],
  check: ["M4 12.5 9 17.5 20 6.5"],
  chevron: ["M9 6l6 6-6 6"],
  navigation: ["M3 11 21 4l-7 17-2.5-7.5z"],
  bell: ["M18 9a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7", "M10.5 20a2 2 0 0 0 3 0"],
  euro: ["M12 4v16", "M15.5 7.5A3.5 3.5 0 0 0 12 6h-.5a3 3 0 0 0 0 6h1a3 3 0 0 1 0 6H12a3.5 3.5 0 0 1-3.5-1.5"]
};
function StatusBar({
  light = false
}) {
  const c = light ? "#fff" : "var(--ink-900)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: 44,
      padding: "0 26px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      color: c,
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: "-0.01em"
    }
  }, "9:41"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 5,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 18 12",
    width: "17",
    height: "11",
    fill: c
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0",
    y: "8",
    width: "3",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "4.5",
    y: "5.5",
    width: "3",
    height: "6.5",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "3",
    width: "3",
    height: "9",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "13.5",
    y: "0",
    width: "3",
    height: "12",
    rx: "1"
  })), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 26 13",
    width: "24",
    height: "12",
    fill: "none"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "0.6",
    y: "0.6",
    width: "21",
    height: "11.8",
    rx: "3.4",
    stroke: c,
    strokeOpacity: ".4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2.4",
    y: "2.4",
    width: "17.4",
    height: "8.2",
    rx: "2.2",
    fill: c
  }), /*#__PURE__*/React.createElement("path", {
    d: "M23.4 4.4v4.2c1.2-.4 1.7-1.1 1.7-2.1s-.5-1.7-1.7-2.1Z",
    fill: c,
    fillOpacity: ".5"
  }))));
}
function Phone({
  children,
  label
}) {
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 390,
      height: 844,
      borderRadius: 46,
      background: "var(--white)",
      position: "relative",
      overflow: "hidden",
      boxShadow: "var(--shadow-l),0 0 0 1px var(--border-subtle)",
      display: "flex",
      flexDirection: "column"
    }
  }, children), label && /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "center",
      marginTop: 14,
      font: "var(--text-eyebrow)",
      letterSpacing: "var(--track-micro)",
      textTransform: "uppercase",
      color: "var(--text-tertiary)"
    }
  }, label));
}

/* Stylised route map: hairline street grid over sand, azul base route, rojo active leg. */
function MapCanvas({
  style,
  progress = 0.45,
  dark = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: dark ? "var(--ink-900)" : "var(--sand-100)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 390 420",
    preserveAspectRatio: "xMidYMid slice",
    style: {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("g", {
    stroke: dark ? "rgba(255,255,255,.09)" : "var(--ink-100)",
    strokeWidth: "1"
  }, [30, 78, 126, 186, 240, 300, 350, 400].map(y => /*#__PURE__*/React.createElement("line", {
    key: y,
    x1: "-20",
    y1: y,
    x2: "410",
    y2: y
  })), [20, 70, 120, 175, 230, 285, 340].map(x => /*#__PURE__*/React.createElement("line", {
    key: x,
    x1: x,
    y1: "-20",
    x2: x + 40,
    y2: "440"
  }))), /*#__PURE__*/React.createElement("g", {
    stroke: dark ? "rgba(255,255,255,.16)" : "var(--sand-300)",
    strokeWidth: "9",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M-10 300 C 90 290, 130 200, 230 190 S 340 120, 420 60",
    fill: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M60 -10 C 80 120, 150 160, 160 440",
    fill: "none"
  })), /*#__PURE__*/React.createElement("path", {
    d: "M-10 300 C 90 290, 130 200, 230 190 S 340 120, 420 60",
    fill: "none",
    stroke: dark ? "rgba(255,255,255,.25)" : "var(--azul-200)",
    strokeWidth: "4",
    strokeLinecap: "round"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M-10 300 C 90 290, 130 200, 230 190 S 340 120, 420 60",
    fill: "none",
    stroke: "var(--rojo-500)",
    strokeWidth: "4",
    strokeLinecap: "round",
    strokeDasharray: "1000",
    strokeDashoffset: 1000 - 1000 * progress
  })));
}
Object.assign(window, {
  I,
  icons,
  StatusBar,
  Phone,
  MapCanvas
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/Shell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/rider_app/TripScreen.jsx
try { (() => {
const {
  Button,
  Card,
  Tag,
  IconButton,
  Badge,
  Avatar,
  DriverRow,
  RouteStops,
  VehicleChip,
  Dialog
} = window.PartimosDesignSystem_2469fc;
function TripScreen({
  trip,
  onBack,
  onBook
}) {
  const [confirm, setConfirm] = React.useState(false);
  const t = trip || {};
  const d = t.driver || {};
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      position: "relative",
      background: "var(--surface-page)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 300
    }
  }, /*#__PURE__*/React.createElement(MapCanvas, {
    progress: 1
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      background: "linear-gradient(180deg,rgba(250,247,243,.5) 0%,rgba(250,247,243,0) 42%)"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(StatusBar, null)), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      padding: "0 26px",
      display: "flex",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    variant: "outline",
    label: "Volver",
    onClick: onBack,
    style: {
      border: "none",
      boxShadow: "0 4px 14px -4px rgba(38,35,43,.22)"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.back,
    s: 20
  })), /*#__PURE__*/React.createElement(IconButton, {
    variant: "outline",
    label: "Compartir",
    style: {
      border: "none",
      boxShadow: "0 4px 14px -4px rgba(38,35,43,.22)"
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.share,
    s: 19
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      marginTop: 168,
      flex: 1,
      overflowY: "auto",
      background: "var(--surface-page)",
      borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
      boxShadow: "var(--shadow-sheet)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "24px 26px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-eyebrow",
    style: {
      color: "var(--azul-500)"
    }
  }, "S\xC1BADO 14 DE JUNIO"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 26,
      letterSpacing: "-0.04em",
      marginTop: 6,
      fontWeight: 400
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 600
    }
  }, t.departAt), " \xB7 3 h 45")), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 32,
      fontWeight: 700,
      letterSpacing: "-0.04em"
    }
  }, t.price, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 500
    }
  }, "$")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12.5,
      color: "var(--text-secondary)"
    }
  }, "por plaza"))), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "md",
    radius: "l",
    style: {
      marginTop: 26
    }
  }, /*#__PURE__*/React.createElement(RouteStops, {
    stops: [{
      place: t.from,
      time: t.departAt,
      detail: "Junto a la entrada principal",
      state: "done"
    }, {
      place: "Santiago",
      time: "10:20",
      detail: "Parada de 10 min",
      state: "pending"
    }, {
      place: t.to,
      time: t.arriveAt,
      detail: "Andén 4, terminal de David",
      state: "pending"
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    tone: "hairline",
    pad: "md",
    radius: "l",
    style: {
      marginTop: 10
    }
  }, /*#__PURE__*/React.createElement(DriverRow, {
    name: d.name,
    rating: d.rating,
    verified: d.verified,
    subtitle: "Conduce desde 2019",
    meta: d.trips ? `${d.trips} viajes` : null,
    actions: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement(IconButton, {
      variant: "outline",
      label: "Mensaje"
    }, /*#__PURE__*/React.createElement(I, {
      d: icons.chat,
      s: 19
    })), /*#__PURE__*/React.createElement(IconButton, {
      variant: "outline",
      label: "Llamar"
    }, /*#__PURE__*/React.createElement(I, {
      d: icons.phone,
      s: 19
    })))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: "var(--border-subtle)",
      margin: "18px 0"
    }
  }), /*#__PURE__*/React.createElement(VehicleChip, {
    model: "Toyota Corolla",
    plate: "AV 4821",
    color: "Gris",
    seats: 4
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "success",
    dot: true
  }, "Confirma al instante"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "M\xE1x. 2 atr\xE1s"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "No fumar"), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, "Mascotas ok"))), /*#__PURE__*/React.createElement(Card, {
    tone: "plain",
    pad: "md",
    radius: "sheet",
    style: {
      marginTop: 10,
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      background: "var(--azul-50)",
      border: "1px solid var(--azul-100)",
      boxShadow: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--azul-500)",
      flex: "none",
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(I, {
    d: icons.shield,
    s: 20
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1.45,
      color: "var(--ink-700)"
    }
  }, "Pago retenido hasta la salida. Si el viaje se cancela, se devuelve entero.")), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 190
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      padding: "16px 26px 26px",
      background: "var(--glass-bg-strong)",
      backdropFilter: "var(--blur-glass)",
      WebkitBackdropFilter: "var(--blur-glass)",
      borderTop: "var(--glass-border)",
      boxShadow: "var(--glass-highlight),0 -8px 32px -12px rgba(0,39,65,.18)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 7,
      marginBottom: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      fontWeight: 700,
      letterSpacing: "-0.045em",
      lineHeight: .95
    }
  }, t.price, " $"), /*#__PURE__*/React.createElement("span", {
    style: {
      transform: "rotate(-8deg)",
      background: "var(--azul-100)",
      color: "var(--azul-700)",
      borderRadius: "var(--radius-pill)",
      padding: "3px 8px",
      fontSize: 10.5,
      fontWeight: 600,
      marginTop: 2
    }
  }, "1 plaza")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    size: "lg",
    block: true,
    onClick: () => setConfirm(true)
  }, "Reservar"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "md",
    block: true
  }, "Escribir a ", (d.name || "").split(" ")[0]))), /*#__PURE__*/React.createElement(Dialog, {
    open: confirm,
    onClose: () => setConfirm(false),
    title: "\xBFReservamos tu plaza?",
    description: `${t.from} → ${t.to}, sábado a las ${t.departAt}. Se cobrarán ${t.price} $ a tu tarjeta guardada.`,
    actions: /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Button, {
      variant: "primary",
      size: "lg",
      block: true,
      onClick: () => {
        setConfirm(false);
        onBook();
      }
    }, "Confirmar y pagar"), /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      size: "md",
      block: true,
      onClick: () => setConfirm(false)
    }, "Volver"))
  }));
}
Object.assign(window, {
  TripScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/rider_app/TripScreen.jsx", error: String((e && e.message) || e) }); }

__ds_ns.BanderaField = __ds_scope.BanderaField;

__ds_ns.Mark = __ds_scope.Mark;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Radio = __ds_scope.Radio;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Stepper = __ds_scope.Stepper;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.DriverRow = __ds_scope.DriverRow;

__ds_ns.RouteStops = __ds_scope.RouteStops;

__ds_ns.TripCard = __ds_scope.TripCard;

__ds_ns.VehicleChip = __ds_scope.VehicleChip;

__ds_ns.TabBar = __ds_scope.TabBar;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
