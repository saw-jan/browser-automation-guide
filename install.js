const { exec } = require("child_process");
const fs = require("fs");
const mv = require("mv");

const executable = "./browsers/google-chrome-stable_current_amd64.deb";
const target = "./browsers";

console.info("[INFO] Installing chrome...");

fs.access(`${target}/chrome`, (err) => {
  if (err) {
    install();
  } else {
    console.log("[INFO] Browser already installed!");
  }
});

function install() {
  try {
    exec(`dpkg -x ${executable} ${target}`, (err) => {
      if (err) {
        throw err;
      }
      cleanDir(target);
    });
  } catch (err) {
    console.info("[INFO] Chrome installed!");
    console.error(err);
  }
}
function cleanDir(dir) {
  fs.rmSync(`${dir}/etc`, { recursive: true });
  fs.rmSync(`${dir}/usr`, { recursive: true });
  mv(
    `${target}/opt/google/chrome`,
    `${target}/chrome`,
    { mkdirp: true },
    function () {
      fs.rmSync(`${dir}/opt`, { recursive: true });
    }
  );

  console.info("[INFO] Chrome installed!");
}
