import os
import tempfile
import shutil
import httpx
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import List, Optional

# Nạp .env từ thư mục whisper/ hoặc backend/.env khi chạy local
_base_dir = Path(__file__).resolve().parent
load_dotenv(_base_dir / ".env")
load_dotenv(_base_dir.parent / "backend" / ".env")

app = FastAPI(title="Whisper STT + Translation Service (API-based)")

# ─────────────────────────────────────────────
# Cấu hình
# ─────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "").strip()
GROQ_STT_URL = "https://api.groq.com/openai/v1/audio/transcriptions"
MYMEMORY_URL  = "https://api.mymemory.translated.net/get"

# Map từ NLLB language code → ISO 639-1 code cho MyMemory
NLLB_TO_ISO = {
    "vie_Latn": "vi",
    "eng_Latn": "en",
    "zho_Hans": "zh-CN",
    "zho_Hant": "zh-TW",
    "fra_Latn": "fr",
    "deu_Latn": "de",
    "jpn_Jpan": "ja",
    "kor_Hang": "ko",
    "tha_Thai": "th",
    "ind_Latn": "id",
    "spa_Latn": "es",
    "por_Latn": "pt",
    "rus_Cyrl": "ru",
}

LANGUAGE_NAME_TO_ISO = {
    "vietnamese": "vi",
    "english": "en",
    "chinese": "zh-CN",
    "mandarin": "zh-CN",
    "french": "fr",
    "german": "de",
    "japanese": "ja",
    "korean": "ko",
    "thai": "th",
    "indonesian": "id",
    "spanish": "es",
    "portuguese": "pt",
    "russian": "ru",
}

ISO_TO_NLLB = {
    "vi": "vie_Latn",
    "en": "eng_Latn",
    "zh": "zho_Hans",
    "zh-cn": "zho_Hans",
    "zh-tw": "zho_Hant",
    "fr": "fra_Latn",
    "de": "deu_Latn",
    "ja": "jpn_Jpan",
    "ko": "kor_Hang",
    "th": "tha_Thai",
    "id": "ind_Latn",
    "es": "spa_Latn",
    "pt": "por_Latn",
    "ru": "rus_Cyrl",
}

def to_iso(code: str) -> str:
    """Chuyển NLLB code (vie_Latn) hoặc ISO code (vi) sang ISO 639-1."""
    if not code:
        return "en"
    cleaned = code.strip()
    if cleaned in NLLB_TO_ISO:
        return NLLB_TO_ISO[cleaned]
    lower = cleaned.lower()
    if lower in LANGUAGE_NAME_TO_ISO:
        return LANGUAGE_NAME_TO_ISO[lower]
    return cleaned[:2].lower() if "_" in cleaned else lower

def to_nllb(code: str) -> str:
    """Chuyển ISO code hoặc tên ngôn ngữ (vd: vietnamese/vi) sang NLLB code."""
    iso = to_iso(code)
    return ISO_TO_NLLB.get(iso, ISO_TO_NLLB.get(iso[:2], "vie_Latn"))

# ─────────────────────────────────────────────
# Request Schemas (backward compatible với Spring Boot)
# ─────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    source_lang: str
    target_lang: str

class TranslateItem(BaseModel):
    text: str
    src: str
    tgt: str

class BatchTranslateRequest(BaseModel):
    items: List[TranslateItem]

# ─────────────────────────────────────────────
# Helper: gọi MyMemory API
# ─────────────────────────────────────────────

async def translate_text(text: str, src: str, tgt: str) -> str:
    """Dịch văn bản qua MyMemory API (miễn phí, không cần API key)."""
    if not text or not text.strip():
        return text
    src_iso = to_iso(src)
    tgt_iso = to_iso(tgt)
    if src_iso == tgt_iso:
        return text
    lang_pair = f"{src_iso}|{tgt_iso}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.get(MYMEMORY_URL, params={
            "q": text[:500],   # MyMemory giới hạn 500 ký tự/request
            "langpair": lang_pair,
        })
        resp.raise_for_status()
        data = resp.json()

    # responseStatus 200 = thành công
    if data.get("responseStatus") == 200:
        return data["responseData"]["translatedText"]
    else:
        # Nếu lỗi, trả về text gốc thay vì crash
        print(f"[WARN] MyMemory lỗi: {data.get('responseDetails')}")
        return text

# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/")
async def root():
    return {"service": "Whisper STT + Translation", "status": "running", "groq_configured": bool(GROQ_API_KEY)}

@app.get("/health")
async def health():
    return {"status": "ok", "groq_configured": bool(GROQ_API_KEY)}


@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: Optional[str] = Form(None),
):
    """
    Speech-to-text dùng Groq Whisper API.
    Nếu không truyền language, Groq Whisper tự động nhận diện ngôn ngữ nói.
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip() or GROQ_API_KEY
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY chưa được cấu hình")

    # Lưu file tạm
    suffix = os.path.splitext(file.filename or "audio")[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        shutil.copyfileobj(file.file, tmp)

    try:
        form_data = {
            "model": "whisper-large-v3-turbo",
            "response_format": "verbose_json",
        }
        if language and language.strip():
            form_data["language"] = to_iso(language.strip())

        # Gọi Groq Whisper API
        async with httpx.AsyncClient(timeout=60.0) as client:
            with open(tmp_path, "rb") as audio_file:
                resp = await client.post(
                    GROQ_STT_URL,
                    headers={"Authorization": f"Bearer {api_key}"},
                    data=form_data,
                    files={"file": (file.filename or "audio" + suffix, audio_file, file.content_type or "audio/webm")},
                )

        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=f"Groq API lỗi: {resp.text}")

        result = resp.json()
        detected_raw = result.get("language") or (language.strip() if language else "vi")
        detected_iso = to_iso(detected_raw)
        return {
            "text": (result.get("text") or "").strip(),
            "language": detected_iso,
            "nllb_language": to_nllb(detected_iso),
        }
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.post("/translate")
async def translate(req: TranslateRequest):
    """Dịch 1 text qua MyMemory API — miễn phí, không cần API key."""
    translated = await translate_text(req.text, req.source_lang, req.target_lang)
    return {"translated_text": translated}


@app.post("/translate/batch")
async def translate_batch(req: BatchTranslateRequest):
    """
    Dịch nhiều text qua MyMemory API.
    Spring TranslationBatchService gọi endpoint này.
    """
    results = []
    for item in req.items:
        try:
            translated = await translate_text(item.text, item.src, item.tgt)
            results.append(translated)
        except Exception as e:
            print(f"[ERROR] Dịch lỗi: {e}")
            results.append(item.text)  # trả về text gốc nếu lỗi
    return results