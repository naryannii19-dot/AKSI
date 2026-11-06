"use strict";

// ================================
// DATA AWAL
// ================================

const defaultQuestions = [
  {
    q:"Apa yang dimaksud dengan siklus akuntansi?",
    options:[
      "Proses pencatatan sampai pelaporan keuangan",
      "Proses menghitung uang kas saja",
      "Proses menjual barang",
      "Proses menentukan harga produk"
    ],
    correct:0,
    explanation:"Siklus akuntansi mencakup tahapan pencatatan, penggolongan, pengikhtisaran, dan pelaporan."
  },
  {
    q:"Buku yang digunakan untuk mencatat transaksi secara kronologis adalah ...",
    options:["Neraca","Jurnal umum","Laporan laba rugi","Buku kas"],
    correct:1,
    explanation:"Jurnal umum mencatat transaksi berdasarkan urutan waktu."
  },
  {
    q:"Pemindahan catatan jurnal ke buku besar disebut ...",
    options:["Posting","Closing","Auditing","Adjusting"],
    correct:0,
    explanation:"Posting adalah pemindahan transaksi dari jurnal ke buku besar."
  },
  {
    q:"Persamaan dasar akuntansi adalah ...",
    options:[
      "Aset = Beban + Pendapatan",
      "Aset = Liabilitas + Ekuitas",
      "Modal = Pendapatan + Beban",
      "Utang = Aset + Modal"
    ],
    correct:1,
    explanation:"Aset sama dengan liabilitas ditambah ekuitas."
  },
  {
    q:"Akun yang memiliki saldo normal debit adalah ...",
    options:["Utang usaha","Modal","Kas","Pendapatan jasa"],
    correct:2,
    explanation:"Kas termasuk aset dan memiliki saldo normal debit."
  },
  {
    q:"Tujuan jurnal penyesuaian adalah ...",
    options:[
      "Menghapus semua transaksi",
      "Menyesuaikan saldo akun pada akhir periode",
      "Mencatat modal awal saja",
      "Mengganti buku besar"
    ],
    correct:1,
    explanation:"Jurnal penyesuaian dibuat agar saldo akun sesuai keadaan akhir periode."
  }
];

const defaultRounds = [
  {
    question:"Sebutkan akun yang termasuk ASET!",
    answers:[
      {text:"Kas",points:40,aliases:["uang kas"]},
      {text:"Piutang Usaha",points:30,aliases:["piutang"]},
      {text:"Peralatan",points:20,aliases:[]},
      {text:"Perlengkapan",points:10,aliases:[]}
    ]
  },
  {
    question:"Sebutkan contoh DOKUMEN TRANSAKSI!",
    answers:[
      {text:"Faktur",points:40,aliases:[]},
      {text:"Kuitansi",points:30,aliases:["kwitansi"]},
      {text:"Nota",points:20,aliases:[]},
      {text:"Bukti Kas Masuk",points:10,aliases:[]}
    ]
  },
  {
    question:"Sebutkan tahapan SIKLUS AKUNTANSI!",
    answers:[
      {text:"Jurnal Umum",points:30,aliases:["jurnal"]},
      {text:"Buku Besar",points:25,aliases:["posting"]},
      {text:"Neraca Saldo",points:20,aliases:[]},
      {text:"Jurnal Penyesuaian",points:15,aliases:[]},
      {text:"Laporan Keuangan",points:10,aliases:[]}
    ]
  },
  {
    question:"Sebutkan contoh LAPORAN KEUANGAN!",
    answers:[
      {text:"Laporan Laba Rugi",points:40,aliases:["laba rugi"]},
      {text:"Laporan Posisi Keuangan",points:35,aliases:["neraca"]},
      {text:"Laporan Perubahan Ekuitas",points:25,aliases:["perubahan modal"]}
    ]
  }
];

const $ = id => document.getElementById(id);
const PREFIX = "aksi_baru_";

function load(name) {
  try {
    const value = JSON.parse(localStorage.getItem(PREFIX + name));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function save(name,data) {
  try {
    localStorage.setItem(PREFIX + name,JSON.stringify(data));
    return true;
  } catch {
    alert("Gagal menyimpan data browser.");
    return false;
  }
}

let questionsExtra = load("questions");
let roundsExtra = load("rounds");
let scores = load("scores");

const questions = () => [...defaultQuestions,...questionsExtra];
const rounds = () => [...defaultRounds,...roundsExtra];

function element(tag,text="",className="") {
  const e = document.createElement(tag);
  e.textContent = text;
  e.className = className;
  return e;
}

function button(text,callback,className="btn light") {
  const b = element("button",text,className);
  b.addEventListener("click",callback);
  return b;
}

// ================================
// NAVIGASI
// ================================

function showPage(id) {
  document.querySelectorAll(".page").forEach(p => {
    p.classList.toggle("active",p.id === id);
  });

  $("navigation").classList.remove("open");

  if(id === "materi") renderMaterials();
  if(id === "nilai") renderScores();
  if(id === "guru") renderManagement();

  window.scrollTo(0,0);
}

document.querySelectorAll("[data-page]").forEach(b => {
  b.addEventListener("click",() => showPage(b.dataset.page));
});

$("menuBtn").addEventListener("click",() => {
  $("navigation").classList.toggle("open");
});

// ================================
// DATABASE FILE PDF/PPT
// ================================

let db;
let viewerURL = null;

function openDB() {
  return new Promise((resolve,reject) => {
    const request = indexedDB.open("AKSI_File_Materi",1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if(!database.objectStoreNames.contains("materials")) {
        database.createObjectStore("materials",{
          keyPath:"id",
          autoIncrement:true
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function dbAction(mode,action) {
  return new Promise((resolve,reject) => {
    if(!db) {
      reject(new Error("Database belum siap"));
      return;
    }

    const tx = db.transaction("materials",mode);
    const store = tx.objectStore("materials");
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.onerror = () => reject(tx.error);
  });
}

const getMaterials = () => dbAction("readonly",s => s.getAll());
const getMaterial = id => dbAction("readonly",s => s.get(id));
const addMaterial = data => dbAction("readwrite",s => s.add(data));
const deleteMaterial = id => dbAction("readwrite",s => s.delete(id));

async function renderMaterials() {
  const list = $("materialList");
  list.replaceChildren();

  if(!db) {
    list.append(element("p","Database belum siap. Buka melalui Live Server."));
    return;
  }

  try {
    const materials = await getMaterials();

    if(!materials.length) {
      const card = element("div","","card");
      card.append(
        element("span","📂","card-icon"),
        element("h3","Belum ada materi"),
        element("p","Buka Panel Guru untuk mengunggah PDF atau PPT.")
      );
      list.append(card);
      return;
    }

    materials.sort((a,b) => b.id-a.id);

    materials.forEach(m => {
      const card = element("article","","card material-card");

      card.append(
        element("span",m.type === "pdf" ? "📕" : "📊","card-icon"),
        element("h3",m.title),
        element("span",m.type.toUpperCase(),"file-tag"),
        element("p",m.description || "Materi Akuntansi Kelas X")
      );

      const actions = element("div","","material-actions");

      if(m.type === "pdf") {
        actions.append(button("👁 Baca PDF",() => viewPDF(m.id)));
      }

      actions.append(button("⬇ Download",() => downloadFile(m.id)));
      card.append(actions);
      list.append(card);
    });
  } catch(err) {
    console.error(err);
    list.append(element("p","Gagal membaca materi."));
  }
}

$("materialForm").addEventListener("submit",async event => {
  event.preventDefault();

  const file = $("materialFile").files[0];
  const title = $("materialTitle").value.trim();
  const description = $("materialDesc").value.trim();

  if(!file || !title) return;

  const ext = file.name.split(".").pop().toLowerCase();

  if(!["pdf","ppt","pptx"].includes(ext)) {
    alert("Format harus PDF, PPT, atau PPTX.");
    return;
  }

  try {
    await addMaterial({
      title,
      description,
      type:ext,
      filename:file.name,
      file:file,
      date:Date.now()
    });

    event.target.reset();
    await renderMaterials();
    await renderManagement();
    alert("Materi berhasil ditambahkan!");
  } catch(err) {
    console.error(err);
    alert("Upload gagal. Periksa kapasitas penyimpanan browser.");
  }
});

async function viewPDF(id) {
  const material = await getMaterial(id);
  if(!material || material.type !== "pdf") return;

  closePDF();

  viewerURL = URL.createObjectURL(material.file);
  $("viewerTitle").textContent = material.title;
  $("pdfFrame").src = viewerURL;
  $("pdfViewer").classList.remove("hidden");
  $("pdfViewer").scrollIntoView({behavior:"smooth"});
}

function closePDF() {
  $("pdfFrame").removeAttribute("src");
  $("pdfViewer").classList.add("hidden");

  if(viewerURL) {
    URL.revokeObjectURL(viewerURL);
    viewerURL = null;
  }
}

$("closeViewer").addEventListener("click",closePDF);

async function downloadFile(id) {
  const material = await getMaterial(id);
  if(!material) return;

  const url = URL.createObjectURL(material.file);
  const link = document.createElement("a");
  link.href = url;
  link.download = material.filename;
  document.body.append(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url),1000);
}

// ================================
// KUIS
// ================================

let quiz = [];
let quizIndex = 0;
let quizCorrect = 0;
let answered = false;

function startQuiz() {
  quiz = questions().slice().sort(() => Math.random()-.5);
  quizIndex = 0;
  quizCorrect = 0;

  $("quizIntro").classList.add("hidden");
  $("quizResult").classList.add("hidden");
  $("quizPlay").classList.remove("hidden");

  showQuestion();
}

function showQuestion() {
  answered = false;
  const q = quiz[quizIndex];

  $("quizCounter").textContent = `Soal ${quizIndex+1} dari ${quiz.length}`;
  const progress = Math.round(quizIndex/quiz.length*100);
  $("quizProgressText").textContent = progress+"%";
  $("quizProgress").style.width = progress+"%";
  $("quizQuestion").textContent = q.q;

  $("quizFeedback").classList.add("hidden");
  $("nextQuiz").classList.add("hidden");

  const box = $("quizOptions");
  box.replaceChildren();

  q.options.forEach((option,i) => {
    const b = button(
      `${"ABCD"[i]}. ${option}`,
      () => answerQuiz(i),
      "quiz-option"
    );
    box.append(b);
  });
}

function answerQuiz(choice) {
  if(answered) return;
  answered = true;

  const q = quiz[quizIndex];
  if(choice === q.correct) quizCorrect++;

  [...$("quizOptions").children].forEach((b,i) => {
    b.disabled = true;
    if(i === q.correct) b.classList.add("correct");
    else if(i === choice) b.classList.add("wrong");
  });

  $("quizFeedback").textContent =
    (choice === q.correct ? "✓ Benar! " : "✕ Belum tepat. ") +
    (q.explanation || "");

  $("quizFeedback").classList.remove("hidden");
  $("nextQuiz").classList.remove("hidden");
  $("nextQuiz").textContent =
    quizIndex === quiz.length-1 ? "Lihat Hasil →" : "Berikutnya →";
}

function nextQuiz() {
  if(!answered) return;
  quizIndex++;

  if(quizIndex >= quiz.length) {
    const score = Math.round(quizCorrect/quiz.length*100);

    $("quizPlay").classList.add("hidden");
    $("quizResult").classList.remove("hidden");
    $("resultScore").textContent = score+"/100";
    $("resultMessage").textContent =
      `Benar ${quizCorrect} dari ${quiz.length} soal.`;

    addScore("Kuis Akuntansi",score);
  } else {
    showQuestion();
  }
}

$("startQuiz").addEventListener("click",startQuiz);
$("retryQuiz").addEventListener("click",startQuiz);
$("nextQuiz").addEventListener("click",nextQuiz);

// ================================
// GAME SURVEY MEMBUKTIKAN
// ================================

let roundIndex = 0;
let gameScore = 0;
let strikes = 0;
let revealed = [];
let roundEnded = false;
let gameSaved = false;

function normalize(text) {
  return String(text).toLowerCase()
    .replace(/[^a-z0-9]/g,"");
}

function renderGame(message="") {
  const data = rounds();
  const round = data[roundIndex];

  $("roundNumber").textContent = `${roundIndex+1}/${data.length}`;
  $("gameScore").textContent = gameScore;
  $("gameQuestion").textContent = round.question;
  $("strikeDisplay").textContent =
    "✕".repeat(strikes)+"☆".repeat(Math.max(0,3-strikes));

  const board = $("answerBoard");
  board.replaceChildren();

  round.answers.forEach((a,i) => {
    const open = revealed.includes(i);
    const tile = element(
      "div","",
      "answer-tile"+(open?" revealed":"")
    );

    tile.append(
      element("span",String(i+1),"answer-number"),
      element("span",open?a.text:"????????"),
      element("span",open?String(a.points):"🔒","answer-points")
    );

    board.append(tile);
  });

  $("gameAnswer").disabled = roundEnded;
  $("checkGame").disabled = roundEnded;
  $("gameMessage").textContent = message;
}

function checkGame() {
  if(roundEnded) return;

  const guess = normalize($("gameAnswer").value);
  if(!guess) return;

  const round = rounds()[roundIndex];

  const index = round.answers.findIndex(a =>
    [a.text,...(a.aliases||[])].some(t => normalize(t) === guess)
  );

  let message;

  if(index >= 0 && !revealed.includes(index)) {
    revealed.push(index);
    gameScore += round.answers[index].points;
    message = `🎉 BENAR! +${round.answers[index].points} poin`;
  } else if(index >= 0) {
    message = "Jawaban sudah terbuka. Coba yang lain!";
  } else {
    strikes++;
    message = `❌ Salah! Kesempatan tersisa: ${3-strikes}`;
  }

  $("gameAnswer").value = "";

  if(strikes >= 3 || revealed.length === round.answers.length) {
    finishRound();
    message += " — Ronde selesai!";
  }

  renderGame(message);
}

function finishRound() {
  roundEnded = true;
  revealed = rounds()[roundIndex].answers.map((_,i) => i);
}

function nextRound() {
  if(roundIndex === rounds().length-1) {
    if(!gameSaved) {
      addScore("Survey Membuktikan!",gameScore);
      gameSaved = true;
    }

    alert("Game selesai! Total skor: "+gameScore);
    restartGame();
    return;
  }

  roundIndex++;
  strikes = 0;
  revealed = [];
  roundEnded = false;
  renderGame();
}

function restartGame() {
  roundIndex = 0;
  gameScore = 0;
  strikes = 0;
  revealed = [];
  roundEnded = false;
  gameSaved = false;
  $("gameAnswer").value = "";
  renderGame();
}

$("checkGame").addEventListener("click",checkGame);
$("gameAnswer").addEventListener("keydown",e => {
  if(e.key === "Enter") checkGame();
});
$("nextRound").addEventListener("click",nextRound);
$("restartGame").addEventListener("click",restartGame);
$("revealGame").addEventListener("click",() => {
  if(!roundEnded) {
    finishRound();
    renderGame("Semua jawaban telah dibuka.");
  }
});
$("fullscreenGame").addEventListener("click",async () => {
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await $("gameShow").requestFullscreen();
  } catch {
    alert("Fullscreen tidak tersedia di browser ini.");
  }
});

// ================================
// NILAI
// ================================

function addScore(type,score) {
  const updated = [{
    type,score,date:new Date().toLocaleString("id-ID")
  },...scores];

  if(save("scores",updated)) scores = updated;
}

function renderScores() {
  const q = scores.filter(x => x.type === "Kuis Akuntansi");
  const g = scores.filter(x => x.type === "Survey Membuktikan!");

  $("bestQuiz").textContent = q.length
    ? Math.max(...q.map(x => x.score))+"/100" : "—";
  $("bestGame").textContent = g.length
    ? Math.max(...g.map(x => x.score)) : "—";

  const list = $("scoreHistory");
  list.replaceChildren();

  if(!scores.length) {
    list.append(element("p","Belum ada aktivitas."));
    return;
  }

  scores.forEach(s => {
    const row = element("div","","history-row");
    const info = element("div");

    info.append(
      element("strong",s.type),
      element("br"),
      element("small",s.date)
    );

    row.append(info,element("strong",String(s.score)));
    list.append(row);
  });
}

// ================================
// PANEL GURU: SOAL
// ================================

$("questionForm").addEventListener("submit",e => {
  e.preventDefault();

  const q = {
    q:$("questionText").value.trim(),
    options:[
      $("answerA").value.trim(),
      $("answerB").value.trim(),
      $("answerC").value.trim(),
      $("answerD").value.trim()
    ],
    correct:Number($("correctAnswer").value),
    explanation:$("questionExplanation").value.trim()
  };

  if(!q.q || q.options.some(x => !x)) return;

  const updated = [...questionsExtra,q];
  if(save("questions",updated)) {
    questionsExtra = updated;
    e.target.reset();
    renderManagement();
    alert("Soal berhasil ditambahkan!");
  }
});

// ================================
// PANEL GURU: RONDE GAME
// ================================

function createRoundFields() {
  const box = $("roundFields");

  for(let i=0;i<5;i++) {
    box.append(element("label","Jawaban "+(i+1)));

    const row = element("div","","round-field");

    const answer = element("input");
    answer.id = "roundAnswer"+i;
    answer.placeholder = "Jawaban, alternatif";

    const points = element("input");
    points.id = "roundPoints"+i;
    points.type = "number";
    points.min = "1";
    points.placeholder = "Poin";

    row.append(answer,points);
    box.append(row);
  }
}

$("roundForm").addEventListener("submit",e => {
  e.preventDefault();

  const question = $("roundQuestion").value.trim();
  const answers = [];

  for(let i=0;i<5;i++) {
    const raw = $("roundAnswer"+i).value.trim();
    const pointRaw = $("roundPoints"+i).value.trim();

    if(!raw && !pointRaw) continue;

    const points = Number(pointRaw);
    if(!raw || !Number.isInteger(points) || points <= 0) {
      alert("Periksa jawaban dan poin nomor "+(i+1));
      return;
    }

    const parts = raw.split(",").map(x => x.trim()).filter(Boolean);
    answers.push({
      text:parts[0],
      aliases:parts.slice(1),
      points
    });
  }

  if(!question || answers.length<2) {
    alert("Isi pertanyaan dan minimal 2 jawaban.");
    return;
  }

  const updated = [...roundsExtra,{question,answers}];
  if(save("rounds",updated)) {
    roundsExtra = updated;
    e.target.reset();
    restartGame();
    renderManagement();
    alert("Ronde berhasil ditambahkan!");
  }
});

// ================================
// PANEL GURU: HAPUS KONTEN
// ================================

async function renderManagement() {
  const box = $("customContent");
  box.replaceChildren();

  if(db) {
    try {
      const materials = await getMaterials();

      materials.forEach(m => {
        const row = element("div","","management-row");
        row.append(
          element("span","📁 "+m.title),
          button("Hapus",async () => {
            if(!confirm("Hapus materi ini?")) return;
            closePDF();
            await deleteMaterial(m.id);
            await renderMaterials();
            await renderManagement();
          },"danger")
        );
        box.append(row);
      });
    } catch(err) {
      console.error(err);
    }
  }

  questionsExtra.forEach((q,i) => {
    addManagementRow("📝 "+q.q,"questions",i);
  });

  roundsExtra.forEach((r,i) => {
    addManagementRow("🎮 "+r.question,"rounds",i);
  });

  if(!box.children.length) {
    box.append(element("p","Belum ada konten tambahan."));
  }
}

function addManagementRow(label,type,index) {
  const row = element("div","","management-row");

  row.append(
    element("span",label),
    button("Hapus",() => {
      if(!confirm("Yakin ingin menghapus?")) return;

      if(type === "questions") {
        const updated = questionsExtra.filter((_,i) => i !== index);
        if(save("questions",updated)) questionsExtra = updated;
      } else {
        const updated = roundsExtra.filter((_,i) => i !== index);
        if(save("rounds",updated)) {
          roundsExtra = updated;
          restartGame();
        }
      }

      renderManagement();
    },"danger")
  );

  $("customContent").append(row);
}

// ================================
// JALANKAN WEBSITE
// ================================

async function initialize() {
  createRoundFields();
  renderScores();
  restartGame();

  try {
    db = await openDB();
    await renderMaterials();
    await renderManagement();
  } catch(err) {
    console.error(err);
    alert("Penyimpanan file tidak tersedia. Jalankan dengan Live Server.");
  }

  showPage("home");
}

initialize();