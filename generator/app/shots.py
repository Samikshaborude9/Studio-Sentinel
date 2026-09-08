"""Live Hollywood Studio Shot Pipeline:
Simulates cinema VFX shots, camera dailies, transcode passes, and DCP packages
flowing through the 4 Studio Sentinel pipeline stages in real time.
"""
import random
from datetime import datetime

STAGE_CONFIGS = {
    "ingest": {
        "service": "ingest",
        "stage_label": "ARRI RAW Sensor Dailies Ingest",
        "project": "DUNE: PART THREE",
        "prefix": "DUNE",
        "aspect_ratio": "2.39:1 Scope",
        "director": "D. Villeneuve",
        "sequence": "REEL-A088 [Ornithopter Canyon Exterior]",
        "resolution": "6.5K ARRI RAW Sensor Uncompressed",
        "compute_node": "INGEST-FIBRE-SAN-01",
        "fps": 24,
        "frames": 240,
        "preview_url": "/shots/dune.jpg",
        "video_url": "/videos/camera_dailies.mp4",
    },
    "transcode": {
        "service": "transcode",
        "stage_label": "ACES Color Gamut Grading & Proxy",
        "project": "BLADE RUNNER 2099",
        "prefix": "BR99",
        "aspect_ratio": "2.40:1 Anamorphic",
        "director": "J. Phelan",
        "sequence": "SEQ-08 [Neon Corridor Pursuit]",
        "resolution": "4K ProRes 4444 XQ ACEScg",
        "compute_node": "COLOR-PIPE-NODE-02",
        "fps": 24,
        "frames": 360,
        "preview_url": "/shots/bladerunner.jpg",
        "video_url": "/videos/vfx_render.mp4",
    },
    "render": {
        "service": "render",
        "stage_label": "8K VFX Multi-Pass 3D Comp",
        "project": "AVATAR: FIRE & ASH",
        "prefix": "AVTR",
        "aspect_ratio": "1.85:1 IMAX",
        "director": "J. Cameron",
        "sequence": "SEQ-14 [Volcanic Caldera Simulation]",
        "resolution": "8K OpenEXR 16-bit ACEScg",
        "compute_node": "GPU-H100-NODE-03",
        "fps": 48,
        "frames": 280,
        "preview_url": "/shots/avatar.jpg",
        "video_url": "/videos/vfx_render.mp4",
    },
    "distribution": {
        "service": "distribution",
        "stage_label": "DCI Master DCP Theatrical Package",
        "project": "TRON: ARES",
        "prefix": "TRON",
        "aspect_ratio": "2.20:1 70mm",
        "director": "J. Kosinski",
        "sequence": "DCP-CHUNK-09 [Dolby Vision Atmos Master]",
        "resolution": "4K DCI Container 250Mbps JPEG2000",
        "compute_node": "EDGE-CDN-REGION-USW",
        "fps": 24,
        "frames": 400,
        "preview_url": "/shots/tron.jpg",
        "video_url": "/videos/dcp_distribution.mp4",
    },
}

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

    def _create_stage_shot(self, service: str, take_num: int = 1):
        cfg = STAGE_CONFIGS[service]
        shot_id = f"{cfg['prefix']}-{random.randint(100, 999)}"
        total_frames = cfg["frames"]
        # Start with a realistic initial completion percentage
        completed = random.randint(int(total_frames * 0.2), int(total_frames * 0.7))
        pct = round((completed / total_frames) * 100, 1)

        seq_title = cfg["sequence"]
        if take_num > 1:
            seq_title = f"{seq_title} [TK-{take_num:02d}]"

        return {
            "id": shot_id,
            "project": cfg["project"],
            "aspect_ratio": cfg["aspect_ratio"],
            "director": cfg["director"],
            "service": service,
            "stage_label": cfg["stage_label"],
            "sequence": seq_title,
            "resolution": cfg["resolution"],
            "compute_node": cfg["compute_node"],
            "fps": cfg["fps"],
            "total_frames": total_frames,
            "completed_frames": completed,
            "progress_pct": pct,
            "status": "IN_PROGRESS",
            "error_message": None,
            "timestamp": datetime.utcnow().strftime("%H:%M:%S UTC"),
            "vram_allocated_gb": round(random.uniform(14.2, 21.8), 1) if service == "render" else None,
            "preview_url": cfg["preview_url"],
            "video_url": cfg["video_url"],
            "take_num": take_num,
        }

    def _init_shots(self):
        # Initialize exactly 1 active shot per pipeline stage for focused real-time monitoring
        for svc in ["ingest", "transcode", "render", "distribution"]:
            self.shots.append(self._create_stage_shot(svc, take_num=1))

    def tick(self, failing_services: set[str]):
        """Advance frames for in-progress shots, trigger failures if matching service is failing."""
        for shot in self.shots:
            svc = shot["service"]

            if svc in failing_services:
                if shot["status"] != "FAILED":
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
                # Advance frames smoothly in real time
                speed = random.randint(10, 24)
                shot["completed_frames"] = min(shot["total_frames"], shot["completed_frames"] + speed)
                shot["progress_pct"] = round((shot["completed_frames"] / shot["total_frames"]) * 100, 1)
                shot["timestamp"] = datetime.utcnow().strftime("%H:%M:%S UTC")

                if shot["completed_frames"] >= shot["total_frames"]:
                    shot["status"] = "COMPLETED"

            elif shot["status"] == "COMPLETED":
                # After completing, cycle to a new take or next sequence in real time
                new_take = shot.get("take_num", 1) + 1
                new_shot = self._create_stage_shot(svc, take_num=new_take)
                new_shot["completed_frames"] = 0
                new_shot["progress_pct"] = 0.0
                idx = self.shots.index(shot)
                self.shots[idx] = new_shot

    def get_all(self):
        return list(self.shots)

# Global singleton manager
SHOT_MANAGER = ShotManager()
