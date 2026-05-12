const fs = require('fs');
const path = require('path');
const originalHtmlPath = path.join(process.env.HOME, 'Downloads/Tests/Test 1/Assessment Examination Center.html');
const targetEjsPath = path.join(__dirname, 'views/exam.ejs');
const webappJsPath = path.join(__dirname, 'public/js/webapp.js');
const assetsDir = path.join(__dirname, 'public/assets');
const imagesDir = path.join(__dirname, 'public/images');
const examAssetsDir = path.join(path.dirname(originalHtmlPath), 'Assessment Examination Center_files');
const missingImages = ['Icon-sprite.png', 'buttons-sprite.png', 'Untitled.jpg', 'calculator_icon.png', 'logo1.png'];
if (fs.existsSync(examAssetsDir)) {
    missingImages.forEach(fname => {
        const src = path.join(examAssetsDir, fname);
        const destDir = fname === 'Icon-sprite.png' || fname === 'buttons-sprite.png' ? imagesDir : assetsDir;
        const dest = path.join(destDir, fname);
        if (fs.existsSync(src)) {
            fs.mkdirSync(destDir, { recursive: true });
            fs.copyFileSync(src, dest);
        }
    });
}
const userAssets = ['Instructions.png', 'Question_Paper.png', 'user.jpg'];
userAssets.forEach(fname => {
    const src = path.join(__dirname, fname);
    const dest = path.join(assetsDir, fname);
    if (fs.existsSync(dest)) return;
    if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
        console.log(`Copied ${fname} to assets/`);
    } else {
        console.warn(`? ${fname} not found in project root or assets - skipping.`);
    }
});
const examPencilSrc = path.join(examAssetsDir, 'exam_pencil.jpg');
if (fs.existsSync(examPencilSrc)) {
    fs.copyFileSync(examPencilSrc, path.join(imagesDir, 'exam_pencil.jpg'));
} else if (!fs.existsSync(path.join(imagesDir, 'exam_pencil.jpg'))) {
    console.warn('? exam_pencil.jpg not found – background will be hidden.');
}
try {
    let webapp = fs.readFileSync(webappJsPath, 'utf8');
    webapp = webapp.replace(/var sBaseURL = root_url;/g, 'var sBaseURL = "/";');
    webapp = webapp.replace(/var sBaseURL = window\.location\.protocol \+ "\/\/"+ window\.location\.hostname \+ "\/";/g, 'var sBaseURL = "/";');
    fs.writeFileSync(webappJsPath, webapp);
} catch(e) {}
try {
    let html = fs.readFileSync(originalHtmlPath, 'utf8');
    html = html.replace(/IIITH/g, 'BITS HD CS');
    html = html.replace(/GO Classes \| BITS HD CS PGEE 2026 Mock Test 1/g, 'BITS HD CS Test 1');
    html = html.replace(/GATEOverflow/g, 'BITS HD CS');
    html = html.replace(/GATE 2022 Examination/g, 'BITS HD CS Test');
    html = html.replace(/Mock Test Assessment/g, 'BITS HD CS Test Assessment');
    html = html.replace(/Organizer : GATEOverflow/g, 'Organizer : BITS');
    html = html.replace(/Organizer : BITS HD CS/g, 'Organizer : BITS');
    html = html.replace(/clone/g, '');
    html = html.replace(/Imposter/g, '');
    html = html.replace(/<div class="examHeaderItem examLogo">[\s\S]*?<\/div>/g, '');
    html = html.replace(/<div class="examHeaderItem examLogo examLogoRight">[\s\S]*?<\/div>/g, '');
    html = html.replace(/<meta[^>]*Content-Security-Policy[^>]*>/gi, '');
    html = html.replace(/<base[^>]*>/gi, '');
    html = html.replace(/ integrity="[^"]*"/gi, '');
    html = html.replace(/ crossorigin="[^"]*"/gi, '');
    html = html.replace(/var root_url\s*=\s*['"][^'"]*['"];/gi, 'var root_url = "/";');
    html = html.replace(/(href|src)=".*?Assessment(?:%20| )Examination(?:%20| )Center_files\/([^"]+\.css)"/gi, '$1="/css/$2"');
    html = html.replace(/(href|src)=".*?Assessment(?:%20| )Examination(?:%20| )Center_files\/([^"]+\.js)"/gi, '$1="/js/$2"');
    html = html.replace(/(href|src)=".*?Assessment(?:%20| )Examination(?:%20| )Center_files\/([^"]+\.(png|jpg|jpeg|gif|svg))"/gi, '$1="/assets/$2"');
    html = html.replace(/url\(['"]?.*?Assessment(?:%20| )Examination(?:%20| )Center_files\/([^'"()]+)['"]?\)/gi, 'url("/assets/$1")');
    html = html.replace(/<script[^>]*src="[^"]*cloudflare[^>]*><\/script>/gi, '');
    html = html.replace(/<script[^>]*src="[^"]*v8c78[^>]*><\/script>/gi, '');
    html = html.replace(/ onload="[^"]*"/g, '');
    html = html.replace(/<script[^>]*src="[^"]*MathJax\.js[^>]*><\/script>/gi, '');
    const katex = `
        <link rel="stylesheet" href="/css/katex.min.css">
        <script defer src="/js/katex.min.js"></script>
        <script defer src="/js/auto-render.min.js" onload="renderMathInElement(document.body, {delimiters:[{left:'$$',right:'$$',display:true},{left:'\\\\(',right:'\\\\)',display:false}],throwOnError:false}); MathJax.Hub._flush();"></script>
    `;
    html = html.replace('</head>', katex + '\n</head>');
    const styleFix = `
    <style>
        #instructionsDiv { overflow-y: auto !important; -webkit-overflow-scrolling: touch; height: calc(100vh - 180px) !important; padding-top: 180px; box-sizing: border-box; }
        #QPDiv { display: none; }
        #QPDiv.show-qp { display: flex !important; flex-direction: column !important; overflow: hidden !important; }
        #viewQPDiv { flex: 1 1 auto !important; overflow-y: auto !important; height: auto !important; padding-bottom: 0 !important; }
        .goBackFooter { position: sticky; bottom: 0; background: #fff; z-index: 2; }
    </style>
    `;
    html = html.replace('</head>', styleFix + '\n</head>');
    const iconFix = `
    <style>
        .instruction_icon { background: url('/assets/Instructions.png') no-repeat center/contain !important; width:18px; height:18px; }
        .questionpaper_icon { background: url('/assets/Question_Paper.png') no-repeat center/contain !important; width:18px; height:18px; }
        #candidateImg { content: url('/assets/user.jpg'); }
    </style>
    `;
    html = html.replace('</head>', iconFix + '\n</head>');
    const injection = `
    <script>
        window.root_url = "/";
        let stored_exam_id = localStorage.getItem("ec_exam_id");
        let new_exam_id = "<%= test_id %>";
        if (stored_exam_id !== new_exam_id) {
            localStorage.removeItem("ec_examBegin");
            localStorage.removeItem("ec_exam_elapsed");
            localStorage.removeItem("ec_exam_start_time");
            localStorage.removeItem("ec_queued_submit");
            if(stored_exam_id) localStorage.removeItem("ec_exam_progress_" + stored_exam_id);
            localStorage.setItem("ec_exam_id", new_exam_id);
            localStorage.setItem("ec_examName", "<%= test_name %>");
            localStorage.setItem("ec_examDuration", "<%= duration_minutes %>");
            localStorage.setItem("ec_total_marks", "<%= total_marks %>");
            localStorage.setItem("ec_exam_ready", "true");
        }
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url, ...rest) { this._interceptUrl = url; return origOpen.call(this, method, url, ...rest); };
        XMLHttpRequest.prototype.send = function(body) {
            if (typeof body === 'string' && this._interceptUrl) {
                const params = new URLSearchParams(body);
                if (this._interceptUrl.includes('webapp.php') && params.get('fn') === 'SubmitResults') {
                    const lean = new URLSearchParams();
                    ['fn','post_response','post_postids','post_qtimetaken'].forEach(k => { if (params.has(k)) lean.set(k, params.get(k)); });
                    body = lean.toString();
                }
            }
            return origSend.call(this, body);
        };
        const origFormSubmit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function() {
            if ((this.action || '').includes('results.php')) {
                this.action = '/results.php';
                Array.from(this.elements).forEach(el => { if (el.name !== 'resultid' && el.name !== 'res_exam_id') el.disabled = true; });
            }
            return origFormSubmit.call(this);
        };
        window.addEventListener('beforeunload', function(e) {
            if (typeof WebApp !== 'undefined' && WebApp.mExamId && WebApp.mQuestionAnswers && WebApp.mQuestionAnswers.length > 1) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
        window.addEventListener('load', function() {
            if(typeof WebApp !== 'undefined') {
                var _origBegin = WebApp.BeginExam;
                var _already = false;
                WebApp.BeginExam = function() {
                    if (_already) return;
                    _already = true;
                    _origBegin.apply(this, arguments);
                    setTimeout(initSectionLocking, 500);
                };
                var sectionsEl = document.getElementById('sections');
                if(sectionsEl) sectionsEl.innerHTML = '';
                var qpEl = document.getElementById('viewQPDiv');
                if(qpEl) qpEl.innerHTML = '';
                var areaEl = document.getElementById('question_area');
                if(areaEl) areaEl.innerHTML = '';
                var QPDisplayOrig = WebApp.DisplayExamPage;
                WebApp.DisplayExamPage = function(page) {
                    QPDisplayOrig.apply(this, arguments);
                    var qpDiv = document.getElementById('QPDiv');
                    if (qpDiv) {
                        if (page === 'questions') {
                            qpDiv.classList.add('show-qp');
                        } else {
                            qpDiv.classList.remove('show-qp');
                        }
                    }
                };
                setTimeout(function() {
                    document.getElementById('instructionsDiv').style.display = 'none';
                    WebApp.DisplayExamPage('active');
                    WebApp.BeginExam();
                }, 200);
            }
        });
        let section2Idx = -1;
        let section2Locked = true;
        let sectionsSwitched = false;
        let unlockTimer = null;
        function initSectionLocking() {
            for (let i = 0; i < WebApp.mSectionNames.length; i++) {
                if (WebApp.mSectionNames[i] === 'Section 2') {
                    section2Idx = i;
                    break;
                }
            }
            if (section2Idx === -1) { console.warn('No Section 2 found'); return; }
            let tab = document.getElementById('s' + (section2Idx + 1));
            if (tab) {
                tab.style.opacity = '0.5';
                tab.style.cursor = 'pointer';
                tab.title = 'Section 2 is locked for the first 45 minutes. Click to advance early.';
                tab.addEventListener('click', function(e) {
                    e.stopPropagation();
                    attemptUnlockSection2();
                });
            }
            let navPanel = document.getElementById('quesNavPanel' + section2Idx);
            if (navPanel) navPanel.style.display = 'none';
            unlockTimer = setTimeout(unlockSection2, 45 * 60 * 1000);
        }
        function attemptUnlockSection2() {
            if (!section2Locked) return;
            let firstConfirm = confirm('WARNING: This action is IRREVERSIBLE!\\n\\nYou are about to proceed to Section 2 (Computer Science).\\nYou will NOT be able to return to Section 1.');
            if (!firstConfirm) return;
            let secondConfirm = confirm('Are you absolutely sure?\\n\\nThis decision cannot be undone. Click OK to proceed to Section 2.');
            if (secondConfirm) {
                unlockSection2();
            }
        }
        function unlockSection2() {
            if (!section2Locked) return;
            section2Locked = false;
            if (unlockTimer) clearTimeout(unlockTimer);
            let tab = document.getElementById('s' + (section2Idx + 1));
            if (tab) {
                tab.style.opacity = '1';
                tab.style.cursor = 'default';
                tab.title = '';
                tab.removeEventListener('click', attemptUnlockSection2);
            }
            if (!sectionsSwitched) {
                for (let i = 0; i < WebApp.mSectionNames.length; i++) {
                    if (i !== section2Idx) {
                        let t = document.getElementById('s' + (i + 1));
                        if (t) {
                            t.style.opacity = '0.4';
                            t.style.pointerEvents = 'none';
                            t.title = 'This section is no longer available';
                        }
                    }
                }
                sectionsSwitched = true;
            }
            WebApp.DisplayExamSectionPage(section2Idx, 0);
        }
    </script>
    </body>
    `;
    html = html.replace('</body>', injection);
    fs.writeFileSync(targetEjsPath, html);
    console.log("✅ exam.ejs generated");
} catch (err) {
    console.error("❌", err.message);
}
