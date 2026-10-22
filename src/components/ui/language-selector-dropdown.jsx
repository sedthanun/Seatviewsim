import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

const storageKey = "seat-view-language";

const languages = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

function getStoredLanguage() {
  try {
    return languages.find(({ code }) => code === localStorage.getItem(storageKey)) || languages[0];
  } catch {
    return languages[0];
  }
}

export function LanguageSelectorDropdown() {
  const [selected, setSelected] = useState(getStoredLanguage);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    document.documentElement.lang = selected.code;
  }, [selected.code]);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  function selectLanguage(language) {
    setSelected(language);
    setOpen(false);
    document.documentElement.lang = language.code;
    try {
      localStorage.setItem(storageKey, language.code);
    } catch {
      // Keep the selector usable when browser storage is unavailable.
    }
  }

  return (
    <div className="language-selector relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        aria-controls={menuId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`เลือกภาษา: ${selected.label}`}
        title="ตัวเลือกภาษา (ตัวอย่าง ยังไม่เปลี่ยนเนื้อหาบนหน้าเว็บ)"
        onClick={() => setOpen((current) => !current)}
        className="flex min-h-11 items-center gap-2 rounded-full border border-[#8eabc540] bg-[#081321cc] px-3.5 py-2 text-sm text-[#edf4ff] shadow-[0_8px_24px_#02061140] backdrop-blur-lg transition-colors hover:border-[#8eabc580] hover:bg-[#13243aeb] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#a4d1ff]"
      >
        <span className="text-base leading-none" aria-hidden="true">{selected.flag}</span>
        <span className="min-w-12 text-left">{selected.label}</span>
        <ChevronDown
          className={`h-4 w-4 text-[#a8bdd4] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          id={menuId}
          role="listbox"
          aria-label="ภาษา"
          className="language-selector-menu absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-xl border border-[#8eabc559] bg-[#0b1729f2] p-1 shadow-[0_18px_48px_#0009] backdrop-blur-xl"
        >
          {languages.map((language) => {
            const active = selected.code === language.code;
            return (
              <button
                key={language.code}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => selectLanguage(language)}
                className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#a4d1ff] ${
                  active
                    ? "bg-[#253b55] font-semibold text-[#b9dcff]"
                    : "text-[#dce8f6] hover:bg-[#25374d]"
                }`}
              >
                <span className="text-base leading-none" aria-hidden="true">{language.flag}</span>
                <span className="flex-1">{language.label}</span>
                {active && <Check className="h-4 w-4 text-[#8ccfff]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const Component = LanguageSelectorDropdown;

export default LanguageSelectorDropdown;
