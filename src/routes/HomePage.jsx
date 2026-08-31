import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Printer,
  Layers,
  Sliders,
  Download,
  Grid,
  Sparkles,
  ExternalLink,
  Github,
  Heart,
  CheckCircle2,
  Clock,
  ArrowRight,
  Archive,
  Hammer,
  ShieldCheck,
  Zap,
  Code2,
  FileText,
  Copy,
  LayoutGrid,
  Info,
} from "lucide-react";

import osirisImg from "../assets/images/osiris.jpg";
import raImg from "../assets/images/ra.jpg";
import obeliskImg from "../assets/images/obelisk.jpg";
import exodiaHeadImg from "../assets/images/exordia-head.jpg";
import exodiaLeftArmImg from "../assets/images/exordia-left-arm.jpg";
import exodiaRightArmImg from "../assets/images/exordia-right-arm.jpg";
import exodiaLeftLegImg from "../assets/images/exordia-left-leg.jpg";
import exodiaRightLegImg from "../assets/images/exordia-right-leg.jpg";
import holactieImg from "../assets/images/holatice.jpg";
import faviconImg from "../assets/images/favicon.png";

const previewCards = [
  {
    name: "Left Arm of the Forbidden One",
    image: exodiaLeftArmImg,
    code: "LOB-123",
  },
  {
    name: "Exodia the Forbidden One",
    image: exodiaHeadImg,
    code: "LOB-124",
  },
  {
    name: "Right Arm of the Forbidden One",
    image: exodiaRightArmImg,
    code: "LOB-122",
  },
  {
    name: "Left Leg of the Forbidden One",
    image: exodiaLeftLegImg,
    code: "LOB-121",
  },
  {
    name: "Holactie the Creator of Light",
    image: holactieImg,
    code: "YGOPR-JP001",
  },
  {
    name: "Right Leg of the Forbidden One",
    image: exodiaRightLegImg,
    code: "LOB-120",
  },
  {
    name: "Slifer the Sky Dragon (Osiris)",
    image: osirisImg,
    code: "G4-01",
  },
  {
    name: "The Winged Dragon of Ra",
    image: raImg,
    code: "G4-03",
  },
  {
    name: "Obelisk the Tormentor",
    image: obeliskImg,
    code: "G4-02",
  },
];

const HomePage = () => {
  const [savedCardCount, setSavedCardCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yugiohCardUrls");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSavedCardCount(parsed.length);
        }
      }
    } catch {
      setSavedCardCount(0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 selection:bg-indigo-500 selection:text-white font-sans">
      {/* Background Ambience / Subtle Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))]"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        ></div>
      </div>

      {/* Navigation Bar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-[#0b0f17]/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md shadow-indigo-500/20 border border-indigo-400/30 flex items-center justify-center bg-slate-900 shrink-0">
              <img
                src={faviconImg}
                alt="Yu-Gi-Oh! Tools Favicon"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">
                  Yu-Gi-Oh! Tools
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  TCG Studio
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <a
              href="#features"
              className="hover:text-white transition-colors duration-150"
            >
              Tính năng
            </a>
            <a
              href="#roadmap"
              className="hover:text-white transition-colors duration-150"
            >
              Hệ sinh thái & Lộ trình
            </a>
            <a
              href="https://github.com/NqtPopCorn"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition-colors duration-150"
            >
              Về tác giả
            </a>
            <a
              href="https://github.com/NqtPopCorn/yugioh-tools"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 hover:text-white transition-colors duration-150 text-slate-400"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/card-printer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all duration-150 shadow-sm hover:shadow-indigo-500/25 active:scale-[0.98]"
            >
              <span>Mở Card Printer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10">
        {/* HERO SECTION */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-12 gap-12 items-center">
              {/* Hero Left Content */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Badge Tag */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/90 border border-slate-700/80 text-xs font-medium text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Dành riêng cho Duelist & Proxy Playtesting</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
                  Chế bản & in bài <br />
                  <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                    Yu-Gi-Oh! chuẩn xác
                  </span>{" "}
                  cho Duelist.
                </h1>

                {/* Subtitle */}
                <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed">
                  Công cụ dàn trang PDF tốc độ cao, hỗ trợ import deck từ file{" "}
                  <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-800/40">
                    .ydk
                  </code>
                  , mã{" "}
                  <code className="text-indigo-300 bg-indigo-950/60 px-1.5 py-0.5 rounded text-sm font-mono border border-indigo-800/40">
                    ydke://
                  </code>
                  , link YGOPRODeck hoặc ảnh DeviantArt. Xử lý 100% trên trình
                  duyệt, giữ nguyên độ nét gốc và chuẩn xác từng milimet.
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <Link
                    to="/card-printer"
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-lg shadow-indigo-600/30 transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <Printer className="w-5 h-5" />
                    <span>Bắt đầu với Card Printer</span>
                    <ArrowRight className="w-4 h-4 ml-0.5" />
                  </Link>

                  {savedCardCount > 0 && (
                    <Link
                      to="/card-printer"
                      className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 hover:border-slate-600 font-medium text-sm transition-all duration-150 shadow-sm cursor-pointer"
                      title="Tiếp tục chỉnh sửa danh sách thẻ đang lưu trong máy"
                    >
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span>
                        Tiếp tục phiên làm việc{" "}
                        <strong className="text-emerald-400 font-semibold">
                          ({savedCardCount} thẻ)
                        </strong>
                      </span>
                    </Link>
                  )}

                  <a
                    href="#features"
                    className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors duration-150"
                  >
                    <span>Khám phá tính năng</span>
                  </a>
                </div>

                {/* Trust Points */}
                <div className="pt-4 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>100% Client-side</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Xuất PDF tức thì</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Chuẩn 59×86 & 62×90</span>
                  </div>
                </div>
              </div>

              {/* Hero Right Visual: Studio A4 Print Sheet Mockup */}
              <div className="lg:col-span-5">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Outer Glow */}
                  <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500/20 via-sky-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-75"></div>

                  {/* Sheet Container */}
                  <div className="relative rounded-2xl bg-slate-900 border border-slate-700/80 p-5 shadow-2xl shadow-black/80">
                    {/* Header bar of preview */}
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800 text-xs">
                      <div className="flex items-center gap-2 text-slate-400 font-mono">
                        <LayoutGrid className="w-3.5 h-3.5 text-indigo-400" />
                        <span>A4 Sheet (3×3 Grid)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-mono font-medium">
                        300 DPI Ready
                      </span>
                    </div>

                    {/* 3x3 Mockup Grid */}
                    <div className="grid grid-cols-3 gap-2.5 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 relative">
                      {/* Corner Crop Marks Simulation */}
                      <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-indigo-400/80 z-20 pointer-events-none"></div>
                      <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-indigo-400/80 z-20 pointer-events-none"></div>
                      <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-indigo-400/80 z-20 pointer-events-none"></div>
                      <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-indigo-400/80 z-20 pointer-events-none"></div>

                      {/* 9 Real Yu-Gi-Oh! Card Arts from assets */}
                      {previewCards.map((card, idx) => (
                        <div
                          key={idx}
                          className="group/card relative aspect-[59/86] rounded overflow-hidden bg-slate-900 border border-slate-700/80 shadow-md transition-all duration-300 hover:scale-105 hover:z-30 hover:shadow-2xl hover:shadow-indigo-500/30 hover:border-indigo-400 cursor-pointer"
                          title={card.name}
                        >
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                            loading="lazy"
                          />
                          {/* Index Badge */}
                          <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[8px] font-mono font-bold text-slate-200 border border-white/10 opacity-90 group-hover/card:opacity-100 transition-opacity">
                            #{idx + 1}
                          </div>
                          {/* Card details overlay on hover */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-1.5 pt-4 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col justify-end pointer-events-none">
                            <span className="text-[8.5px] font-bold text-white truncate leading-tight">
                              {card.name}
                            </span>
                            <div className="flex justify-between items-center text-[7px] text-indigo-300 font-mono mt-0.5">
                              <span>{card.code}</span>
                              <span>59×86mm</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>Standard: 59×86 mm</span>
                      <span className="text-indigo-400">Sleeve: 62×90 mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FLAGSHIP TOOL SPOTLIGHT SECTION */}
        <section id="features" className="py-20 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-wider text-indigo-400 uppercase bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                Flagship Tool
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
                Card Printer Studio
              </h2>
              <p className="text-base text-slate-400 mt-3">
                Được tinh chỉnh cho nhu cầu thực chiến của Duelist: chuẩn kích
                thước, tốc độ tức thì và chất lượng bản in sắc nét.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors duration-200">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Import Đa Nguồn
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Hỗ trợ tệp <code className="text-slate-300">.ydk</code>, mã{" "}
                    <code className="text-slate-300">ydke://</code>, link
                    YGOPRODeck, DeviantArt API và dán ảnh trực tiếp từ clipboard (
                    <kbd className="text-xs font-mono bg-slate-800 px-1 py-0.5 rounded text-slate-300">
                      Ctrl+V
                    </kbd>
                    ).
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors duration-200">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-4">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Chuẩn TCG & Sleeve Fit
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Preset chuẩn thẻ Konami (59×86 mm) hoặc kích thước lọt vừa
                    bọc bài (62×90 mm). Hỗ trợ đo lường theo mm hoặc inch tuỳ ý.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors duration-200">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                    <Grid className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Kéo Thả & Nhân Bản
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Sắp xếp linh hoạt thứ tự thẻ bài bằng Drag & Drop, nhân bản
                    nhanh số lượng bản in cho từng thẻ và hỗ trợ đường cắt (Crop
                    marks).
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl bg-slate-900/60 border border-slate-800 p-6 flex flex-col justify-between hover:border-slate-700 transition-colors duration-200">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                    <Download className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Xuất PDF Độ Nét Cao
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Kết xuất file PDF khổ A4/Letter độ nét cao ngay trên máy
                    tính. Không giảm nén mờ ảnh, sẵn sàng mang ra tiệm in hoặc tự
                    in tại nhà.
                  </p>
                </div>
              </div>
            </div>

            {/* Direct Tool Launch Box */}
            <div className="mt-10 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-indigo-950/40 border border-indigo-500/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xl font-bold text-white">
                  Sẵn sàng chuẩn bị bộ bài của bạn?
                </h4>
                <p className="text-sm text-slate-400">
                  Không cần đăng ký tài khoản. Mở công cụ và bắt đầu dàn trang
                  ngay lập tức.
                </p>
              </div>
              <Link
                to="/card-printer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all duration-150 shadow-md shadow-indigo-600/30 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Mở Card Printer</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ROADMAP & ECOSYSTEM SECTION */}
        <section id="roadmap" className="py-20 border-b border-slate-800/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-bold tracking-wider text-sky-400 uppercase bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                Hệ Sinh Thái & Lộ Trình
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-4 tracking-tight">
                Trạng thái các công cụ
              </h2>
              <p className="text-base text-slate-400 mt-3">
                Minh bạch và tập trung vào những giá trị thiết thực nhất cho cộng
                đồng Duelist.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Tool 1: Card Printer (Active) */}
              <div className="rounded-2xl bg-slate-900/80 border-2 border-emerald-500/40 p-6 flex flex-col justify-between relative shadow-lg shadow-emerald-950/20">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Đang hoạt động (Stable)
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      v1.0
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Printer className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Card Printer
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      Công cụ chế bản trang in thẻ bài proxy Yu-Gi-Oh! toàn diện:
                      nhập decklist, căn chỉnh kích thước chuẩn và xuất PDF A4
                      sẵn sàng in ấn.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <Link
                    to="/card-printer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-all duration-150 shadow-sm cursor-pointer"
                  >
                    <span>Sử dụng công cụ</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Tool 2: Card Maker (Future Roadmap) */}
              <div className="rounded-2xl bg-slate-900/40 border border-amber-500/30 p-6 flex flex-col justify-between relative">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
                      <Clock className="w-3.5 h-3.5" />
                      Kế hoạch tương lai
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      Concept
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                    <Hammer className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Custom Card Maker
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Trình thiết kế thẻ bài tuỳ chỉnh (Custom Card), hỗ trợ các
                      khung bài OCG/TCG, hiệu ứng giả lập foil và tạo văn bản
                      hiệu ứng chuẩn format Konami.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <div className="text-center py-2 text-xs font-medium text-amber-400/80 bg-amber-500/5 rounded-lg border border-amber-500/10">
                    Đang nghiên cứu & phát triển
                  </div>
                </div>
              </div>

              {/* Tool 3: Multiplayer Link Maker (Archived) */}
              <div className="rounded-2xl bg-slate-900/30 border border-slate-800 p-6 flex flex-col justify-between opacity-75">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-medium">
                      <Archive className="w-3.5 h-3.5" />
                      Đã lưu trữ (Archived)
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                    <Code2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-200 mb-2">
                      Multiplayer Link Maker
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      Dự án thử nghiệm sinh ma trận đồ thị ngẫu nhiên (Erdős–Rényi)
                      cho thể thức thi đấu nhiều người. Đã đóng lưu trữ để tập
                      trung toàn lực phát triển Card Printer.
                    </p>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-800">
                  <div className="text-center py-2 text-xs font-medium text-slate-500 bg-slate-800/40 rounded-lg border border-slate-800">
                    Đã ngừng phát triển
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ABOUT CREATOR & PHILOSOPHY SECTION */}
        <section id="about" className="py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                {/* Header of About */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-xl shadow-lg border border-indigo-400/30">
                      NP
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">
                        NqtPopCorn
                      </h3>
                      <p className="text-sm text-indigo-400 font-medium">
                        Creator of Yu-Gi-Oh! Tools • LowCost Duelist
                      </p>
                    </div>
                  </div>

                  <a
                    href="https://github.com/NqtPopCorn/yugioh-tools"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-sm font-medium transition-all duration-150"
                  >
                    <Github className="w-4 h-4" />
                    <span>Xem mã nguồn trên GitHub</span>
                    <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
                  </a>
                </div>

                {/* Personal Story */}
                <div className="space-y-4 text-slate-300 leading-relaxed text-base">
                  <p>
                    Chào mọi người, mình là một người chơi Yu-Gi-Oh! lâu năm. Dự
                    án này ra đời từ chính nhu cầu thực tế của mình và nhóm bạn
                    chơi bài:{" "}
                    <strong className="text-white">
                      làm sao để tạo ra các bản in proxy bài test deck sắc nét,
                      chuẩn xác kích thước thực tế mà không phải mất thời gian căn
                      chỉnh thủ công từng lá bài trong Word hay Photoshop.
                    </strong>
                  </p>
                  <p className="text-slate-400 text-sm">
                    Mục tiêu của dự án là phục vụ cộng đồng chơi bài LowCost, các
                    Duelist muốn thử nghiệm chiến thuật, thi đấu giao lưu hoặc
                    chuẩn bị cho các giải đấu trước khi quyết định đầu tư bài
                    thật.
                  </p>
                </div>

                {/* Core Values */}
                <div className="grid sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>100% Client-side</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Mọi xử lý ảnh và PDF đều diễn ra trên máy bạn. Không lưu
                      trữ dữ liệu người dùng, không cần tạo tài khoản.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm mb-1.5">
                      <Heart className="w-4 h-4" />
                      <span>Miễn phí & Không QC</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Dự án phi lợi nhuận vì cộng đồng. Không gắn banner quảng
                      cáo gây phiền toái hay che khuất giao diện.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center gap-2 text-sky-400 font-bold text-sm mb-1.5">
                      <Code2 className="w-4 h-4" />
                      <span>Mã nguồn mở</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Mã nguồn được công khai. Hoan nghênh mọi đóng góp, sửa lỗi
                      hoặc đề xuất tính năng mới từ các Duelist.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-[#070a10] text-slate-400 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-indigo-400" />
              <span className="font-bold text-slate-200">
                Yu-Gi-Oh! TCG Tools
              </span>
              <span className="text-slate-500">|</span>
              <span>Made with passion for LowCost Yu-Gi-Oh! Community</span>
            </div>

            <div className="flex items-center gap-6">
              <Link
                to="/card-printer"
                className="hover:text-slate-200 transition-colors cursor-pointer"
              >
                Card Printer
              </Link>
              <a
                href="https://github.com/NqtPopCorn/yugioh-tools"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-200 transition-colors"
              >
                GitHub Repository
              </a>
              <a
                href="https://github.com/NqtPopCorn/yugioh-tools/issues"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-200 transition-colors"
              >
                Báo lỗi / Góp ý
              </a>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/60 text-slate-500 text-[11px] leading-relaxed text-center md:text-left">
            <p>
              Yu-Gi-Oh! và toàn bộ hình ảnh thẻ bài liên quan là tài sản sở hữu
              trí tuệ của © Studio Dice / SHUEISHA, TV TOKYO, KONAMI.
            </p>
            <p className="mt-1">
              Bộ công cụ này là dự án phi thương mại của cộng đồng, phục vụ mục
              đích playtesting cá nhân và nghiên cứu chiến thuật.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
