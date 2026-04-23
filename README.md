# SSH Switch

A lightweight desktop application to switch between multiple SSH configurations quickly.

Built with Tauri, React, and Vite, SSH Switch helps developers manage SSH identities without manually editing config files.

---

## Features

* Switch between multiple SSH profiles
* Fast and lightweight desktop app (Tauri-based)
* Simple and clean interface
* Works with existing SSH configuration

---

## Download

You can download the latest version from the GitHub Releases page:

https://github.com/therohanparmar/ssh-switch/releases

### Available builds

* Linux - .deb
* Windows - Coming Soon
* Mac - Coming Soon

### Quick install (Linux)

#### Using .deb

```bash
sudo dpkg -i ssh-switch_1.0.0_amd64.deb
```

---

## Usage

1. Open the application
2. Add or import your SSH profiles
3. Select the profile you want to activate
4. The app updates your `~/.ssh/config` automatically

---

## Tech Stack

* React (frontend)
* Vite (build tool)
* Rust (Tauri backend)

---

## Installation

### Prerequisites

* Node.js (v18 or higher)
* Rust and Cargo
* Linux system dependencies (for GTK/WebKit)

### Install Rust

```bash
curl https://sh.rustup.rs -sSf | sh
source $HOME/.cargo/env
```

### Install dependencies (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y \
  pkg-config \
  libgtk-3-dev \
  libglib2.0-dev \
  libwebkit2gtk-4.1-dev \
  build-essential
```

---

## Run locally

```bash
npm install
npm run tauri dev
```

---

## How it works

The app interacts with your local SSH configuration (`~/.ssh/config`) and allows you to:

1. Store multiple SSH profiles
2. Switch between them quickly
3. Avoid manual edits

---

## Notes

* Back up your `~/.ssh/config` before using
* The app modifies local SSH settings

---

## Contributing

1. Fork the repository
2. Create a new branch
3. Commit your changes
4. Open a pull request

---

## License

MIT License

---

## Author

[Rohan Parmar](https://www.linkedin.com/in/rohanrparmar/)

---

## Version

v1.0.0 – Initial stable release
