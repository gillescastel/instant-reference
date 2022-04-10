import {execa, execaCommand} from "execa";

import dbus from "dbus-next";

export async function getCurrentPdfPage() {
  try {
    var {stdout: windowId} = await execaCommand("xdotool getactivewindow");
  } catch (e) {
    console.log('Could not find active window. Is xdotool installed?');
  }

  try {
    var {stdout: xClassStr} = await execa("xprop", [
      "-id",
      windowId,
      "WM_CLASS",
    ]);
  } catch (e) {
    console.log('Could not get X window Class. Is xprop installed?');
  }

  const xClass = xClassStr.split(" = ")[1];
  const {stdout: pid} = await execaCommand(
    "xdotool getactivewindow getwindowpid"
  );

  if (xClass.includes("zathura"))
    return await getZathuraMetadata(pid)

  if (xClass.includes("evince"))
    return await getEvinceMetadata(pid)

  return null;
}


async function getZathuraMetadata(pid) {
  console.log('Found zathura window');
  const bus = dbus.sessionBus();
  const obj = await bus.getProxyObject(
    `org.pwmt.zathura.PID-${pid}`,
    "/org/pwmt/zathura"
  );
  const properties = obj.getInterface("org.freedesktop.DBus.Properties");

  const page = (await properties.Get("org.pwmt.zathura", "pagenumber")).value;
  const path = (await properties.Get("org.pwmt.zathura", "filename")).value;
  bus.disconnect();
  return {page, path};
}

async function getEvinceMetadata(pid) {
  console.log('Found evince window');
  const {stdout: paths} = await execaCommand(`realpath /proc/${pid}/fd/*`, {shell: true});
  const path = paths.split('\n').find(p => p.endsWith('.pdf')).trim();
  const {stdout: metadata} = await execa("gio", [
    "info",
    "-a",
    "metadata::evince::page",
    path,
  ]);

  try {
    const {groups: {page} = {page: null}} = metadata.match(
      /metadata::evince::page:\s*(?<page>\d+)/
    );
    return {page: parseInt(page), path};
  } catch (e) {
    console.log('Could not find evince metadata. Are you running the snap-version or is apparmor in enforced mode? Check README for help.');
    return null
  }
}
