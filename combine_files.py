from __future__ import annotations

import argparse
from pathlib import Path

DEFAULT_EXCLUDED_DIRECTORIES = {
    ".cache",
    ".git",
    ".kilo",
    ".next",
    ".turbo",
    ".venv",
    "__pycache__",
    "build",
    "coverage",
    "dist",
    "node_modules",
    "out",
    "venv",
}
BINARY_EXTENSIONS = {
    ".7z",
    ".avi",
    ".bmp",
    ".dll",
    ".exe",
    ".gif",
    ".gz",
    ".ico",
    ".jpeg",
    ".jpg",
    ".mp3",
    ".mp4",
    ".node",
    ".pdf",
    ".png",
    ".rar",
    ".wav",
    ".webp",
    ".zip",
}


def parse_arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Combine project files into one AI context text file."
    )
    parser.add_argument(
        "directory",
        nargs="?",
        type=Path,
        help="Directory to combine (defaults to this script's directory)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        help="Output text file (defaults to context.txt in the selected directory)",
    )
    return parser.parse_args()


def is_binary(path: Path) -> bool:
    if path.suffix.lower() in BINARY_EXTENSIONS:
        return True

    try:
        with path.open("rb") as file:
            return b"\0" in file.read(8192)
    except OSError:
        return False


def read_file(path: Path) -> str:
    try:
        data = path.read_bytes()
    except OSError as error:
        return f"[UNREADABLE FILE: {error}]"

    if is_binary(path):
        return "[BINARY FILE: CONTENT OMITTED]"

    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("utf-8", errors="replace")


def collect_files(directory: Path, output: Path) -> list[Path]:
    files = [
        path
        for path in directory.rglob("*")
        if path.is_file()
        and path.resolve() != output.resolve()
        and not any(
            part in DEFAULT_EXCLUDED_DIRECTORIES
            for part in path.relative_to(directory).parts[:-1]
        )
    ]
    return sorted(files, key=lambda path: path.relative_to(directory).as_posix())


def combine_files(directory: Path, output: Path) -> tuple[int, int]:
    files = collect_files(directory, output)
    sections = [
        "AI PROJECT CONTEXT",
        f"Source directory: {directory.resolve()}",
        f"Included files: {len(files)}",
        f"Excluded directories: {', '.join(sorted(DEFAULT_EXCLUDED_DIRECTORIES))}",
        "",
    ]

    binary_count = 0
    for path in files:
        relative_path = path.relative_to(directory).as_posix()
        content = read_file(path)
        if content.startswith("[BINARY FILE:"):
            binary_count += 1

        sections.extend(
            [
                f"===== FILE: {relative_path} =====",
                content,
                "",
            ]
        )

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text("\n".join(sections), encoding="utf-8")
    return len(files), binary_count


def main() -> None:
    arguments = parse_arguments()
    directory = (
        arguments.directory.resolve()
        if arguments.directory
        else Path(__file__).resolve().parent
    )
    output = arguments.output.resolve() if arguments.output else directory / "context.txt"

    if not directory.is_dir():
        raise SystemExit(f"Directory not found: {directory}")

    file_count, binary_count = combine_files(directory, output)
    print(
        f"Combined {file_count} files into {output} ({binary_count} binary files omitted)."
    )


if __name__ == "__main__":
    main()