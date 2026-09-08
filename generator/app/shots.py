"""Live Hollywood Studio Shot Generator:
Simulates cinema VFX shots, dailies camera reels, transcode passes, and DCP distribution
packages flowing through the Studio Sentinel pipeline in real time.
"""
import random
import time
from datetime import datetime

PROJECTS = [
    {
        "name": "DUNE: PART THREE",
        "prefix": "DUNE",
        "aspect": "2.39:1 Scope",
        "director": "D. Villeneuve",
        "preview_url": "/shots/dune.jpg",
        "video_url": "/videos/reel_sample.mp4",
    },
    {
        "name": "AVATAR: FIRE & ASH",
        "prefix": "AVTR",
        "aspect": "1.85:1 IMAX",
        "director": "J. Cameron",
        "preview_url": "/shots/avatar.jpg",
        "video_url": "/videos/reel_sample.mp4",
    },
    {
        "name": "BLADE RUNNER 2099",
        "prefix": "BR99",
        "aspect": "2.40:1 Anamorphic",
        "director": "J. Phelan",
        "preview_url": "/shots/bladerunner.jpg",
        "video_url": "/videos/reel_sample.mp4",
    },
    {
        "name": "TRON: ARES",
        "prefix": "TRON",
        "aspect": "2.20:1 70mm",
        "director": "J. Kosinski",
        "preview_url": "/shots/tron.jpg",
        "video_url": "/videos/reel_sample.mp4",
    },
    {
        "name": "ODYSSEY: ZERO",
        "prefix": "ODYS",
        "aspect": "2.39:1 Scope",
        "director": "C. Nolan",
        "preview_url": "/shots/dune.jpg",
        "video_url": "/videos/reel_sample.mp4",
    },
]

SHOT_TEMPLATES = [
    {
        "service": "render",
        "stage_label": "8K VFX Multi-Pass Comp",
        "seq": "SEQ-04 [Ornithopter Canyon Ambush]",
        "res": "8K OpenEXR 16-bit ACEScg",
        "node": "GPU-H100-NODE-03",
        "fps": 24,
        "frames": 240,
    },
    {
        "service": "render",
        "stage_label": "Volumetric Lighting & NeRF Pass",
        "seq": "SEQ-12 [Bioluminescent Oceanic Trench]",
        "res": "8K Stereo OpenEXR",
        "node": "GPU-H100-NODE-08",
        "fps": 48,
        "frames": 360,
    },
    {
        "service": "transcode",
        "stage_label": "ProRes 4444 XQ Editorial Proxy",
        "seq": "SEQ-08 [Neon Corridor Pursuit]",
        "res": "4K ProRes 4444 XQ Rec.709",
        "node": "ENCODER-NODE-02",
        "fps": 24,
        "frames": 480,
    },
    {
        "service": "ingest",
        "stage_label": "ARRI RAW Dailies Checksum & Ingest",
        "seq": "REEL-A088 [Main Stage Night Exterior]",
        "res": "6.5K ARRI RAW Sensor Uncompressed",
        "node": "INGEST-FIBRE-SAN-01",
        "fps": 24,
        "frames": 720,
    },
    {
        "service": "distribution",
        "stage_label": "DCI Master DCP Theatrical Package",
        "seq": "DCP-CHUNK-09 [Dolby Vision Atmos Master]",
        "res": "4K DCI Container 250Mbps JPEG2000",
        "node": "EDGE-CDN-REGION-USW",
        "fps": 24,
        "frames": 500,
    },
    {
        "service": "render",
        "stage_label": "Crowd Simulation & Cloth FX",
        "seq": "SEQ-02 [Imperial Arena Entrance]",
        "res": "8K OpenEXR ACEScg",
        "node": "GPU-A100-NODE-12",
        "fps": 24,
        "frames": 180,
    },
    {
        "service": "transcode",
        "stage_label": "ACES Color Gamut Grading Cache",
        "seq": "SEQ-05 [Sunken Citadel Chamber]",
        "res": "4K ACESproxy 10-bit",
        "node": "COLOR-PIPE-NODE-01",
        "fps": 24,
        "frames": 320,
    },
    {
        "service": "ingest",
        "stage_label": "High-Speed Phantom Flex 4K High-Speed",
        "seq": "REEL-C012 [Pyrotechnic Explosion 1000fps]",
        "res": "4K CineRAW 1000 FPS High-Speed",
        "node": "INGEST-FIBRE-SAN-03",
        "fps": 1000,
        "frames": 1200,
    },
]

FAILURE_ERRORS = {
    "render": "CUDA out of memory (2.14 GiB allocation failed on Device:0, worker OOM-killed)",
    "ingest": "ARRI RAW MD5 checksum mismatch on sensor packet #84102, I/O bus dropped",
    "distribution": "504 Gateway Timeout pushing encrypted DCP chunk #4019 to edge CDN",
    "transcode": "Color look-up table LUT overflow in ACES 1.3 gamut transform buffer",
}

class ShotManager:
    def __init__(self):
        self.shots = []
        self._init_shots()

    def _generate_shot(self, force_service=None, force_status="IN_PROGRESS"):
        tpl = random.choice([t for t in SHOT_TEMPLATES if force_service is None or t["service"] == force_service])
        proj = random.choice(PROJECTS)
        shot_num = random.randint(100, 999)
        shot_id = f"{proj['prefix']}-{shot_num}"
        
        total_frames = tpl["frames"]
        if force_status == "COMPLETED":
            completed = total_frames
        elif force_status == "QUEUED":
            completed = 0
        else:
            completed = random.randint(int(total_frames * 0.15), int(total_frames * 0.85))

        pct = round((completed / total_frames) * 100, 1)

        return {
            "id": shot_id,
            "project": proj["name"],
            "aspect_ratio": proj["aspect"],
            "director": proj["director"],
            "service": tpl["service"],
            "stage_label": tpl["stage_label"],
            "sequence": tpl["seq"],
            "resolution": tpl["res"],
            "compute_node": tpl["node"],
            "fps": tpl["fps"],
            "total_frames": total_frames,
            "completed_frames": completed,
            "progress_pct": pct,
            "status": force_status,
            "error_message": None,
            "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "vram_allocated_gb": round(random.uniform(14.2, 21.8), 1) if tpl["service"] == "render" else None,
            "preview_url": proj.get("preview_url", "/shots/dune.jpg"),
            "video_url": proj.get("video_url", "/videos/reel_sample.mp4"),
        }

    def _init_shots(self):
        # Seed initial pool of diverse shots
        for _ in range(4):
            self.shots.append(self._generate_shot(force_status="COMPLETED"))
        for s in ["render", "transcode", "ingest", "distribution"]:
            self.shots.append(self._generate_shot(force_service=s, force_status="IN_PROGRESS"))
        for _ in range(2):
            self.shots.append(self._generate_shot(force_status="QUEUED"))

    def tick(self, failing_services: set[str]):
        """Advance frames for in-progress shots, trigger failures if matching service is failing."""
        for shot in self.shots:
            svc = shot["service"]

            if svc in failing_services:
                # Failing service turns active shots to FAILED
                if shot["status"] in ("IN_PROGRESS", "QUEUED"):
                    shot["status"] = "FAILED"
                    shot["error_message"] = FAILURE_ERRORS.get(svc, f"Service {svc} incident active")
                    shot["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")
                continue

            # If service is healthy and shot was previously failed, recover it
            if shot["status"] == "FAILED" and svc not in failing_services:
                shot["status"] = "IN_PROGRESS"
                shot["error_message"] = None
                shot["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")

            if shot["status"] == "IN_PROGRESS":
                # Advance frames
                speed = random.randint(15, 40)
                shot["completed_frames"] = min(shot["total_frames"], shot["completed_frames"] + speed)
                shot["progress_pct"] = round((shot["completed_frames"] / shot["total_frames"]) * 100, 1)
                shot["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")

                if shot["completed_frames"] >= shot["total_frames"]:
                    shot["status"] = "COMPLETED"

            elif shot["status"] == "QUEUED":
                # Chance to start
                if random.random() < 0.4:
                    shot["status"] = "IN_PROGRESS"
                    shot["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")

        # If too many completed, introduce new queued/in-progress shots
        active_count = sum(1 for s in self.shots if s["status"] in ("IN_PROGRESS", "QUEUED", "FAILED"))
        if active_count < 5:
            new_shot = self._generate_shot(force_status="IN_PROGRESS")
            self.shots.insert(0, new_shot)

        # Keep rolling history limited to 15 shots
        self.shots = self.shots[:15]

    def get_all(self):
        return list(self.shots)


# Global singleton manager
SHOT_MANAGER = ShotManager()
