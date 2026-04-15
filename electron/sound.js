import { exec } from "node:child_process";
import { writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";

// PowerShell script: list active render (output) devices as JSON
const ENUM_SCRIPT = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int stateMask, [MarshalAs(UnmanagedType.Interface)] out IMMDeviceCollection ppDevices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppEndpoint);
    int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppDevice);
    int RegisterEndpointNotificationCallback(IntPtr pClient);
    int UnregisterEndpointNotificationCallback(IntPtr pClient);
}

[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection {
    int GetCount(out uint pcDevices);
    int Item(uint nDevice, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppDevice);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.Interface)] out object ppInterface);
    int OpenPropertyStore(int stgmAccess, [MarshalAs(UnmanagedType.Interface)] out IPropertyStore ppProperties);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
    int GetState(out uint pdwState);
}

[Guid("886D8EEB-8CF2-4446-8D02-CDBA1DBDCF99")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPropertyStore {
    int GetCount(out uint cProps);
    int GetAt(uint iProp, out PropertyKey pkey);
    int GetValue(ref PropertyKey key, out PropVariant pv);
    int SetValue(ref PropertyKey key, ref PropVariant pv);
    int Commit();
}

[StructLayout(LayoutKind.Sequential)]
struct PropertyKey {
    public Guid fmtid;
    public uint pid;
}

[StructLayout(LayoutKind.Sequential)]
struct PropVariant {
    public ushort vt;
    public ushort r1, r2, r3;
    public IntPtr p;
    public int p2;
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
[ClassInterface(ClassInterfaceType.None)]
class MMDeviceEnumeratorClass {}

public static class AudioHelper {
    static readonly Guid PKEY_FriendlyName_fmtid = new Guid("a45c254e-df1c-4efd-8020-67d146a850e0");
    const uint PKEY_FriendlyName_pid = 14;

    public static List<string[]> GetDevices() {
        var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorClass();
        IMMDeviceCollection collection;
        enumerator.EnumAudioEndpoints(0, 1, out collection);
        uint count;
        collection.GetCount(out count);
        var result = new List<string[]>();
        for (uint i = 0; i < count; i++) {
            IMMDevice device;
            collection.Item(i, out device);
            string id;
            device.GetId(out id);
            IPropertyStore store;
            device.OpenPropertyStore(0, out store);
            PropertyKey key = new PropertyKey();
            key.fmtid = PKEY_FriendlyName_fmtid;
            key.pid = PKEY_FriendlyName_pid;
            PropVariant pv;
            store.GetValue(ref key, out pv);
            string name = Marshal.PtrToStringUni(pv.p);
            if (name == null) name = id;
            result.Add(new string[] { id, name });
        }
        return result;
    }
}
"@ -Language CSharp

$devices = [AudioHelper]::GetDevices()
$json = '['
for ($i = 0; $i -lt $devices.Count; $i++) {
    $id = $devices[$i][0] -replace '"', '\\"'
    $name = $devices[$i][1] -replace '"', '\\"'
    if ($i -gt 0) { $json += ',' }
    $json += '{"id":"' + $id + '","name":"' + $name + '"}'
}
$json += ']'
Write-Output $json
`;

// PowerShell script: get current default render device ID
const CURRENT_SCRIPT = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceCollection {
    int GetCount(out uint pcDevices);
    int Item(uint nDevice, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppDevice);
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDeviceEnumerator {
    int EnumAudioEndpoints(int dataFlow, int stateMask, [MarshalAs(UnmanagedType.Interface)] out IMMDeviceCollection ppDevices);
    int GetDefaultAudioEndpoint(int dataFlow, int role, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppEndpoint);
    int GetDevice([MarshalAs(UnmanagedType.LPWStr)] string pwstrId, [MarshalAs(UnmanagedType.Interface)] out IMMDevice ppDevice);
    int RegisterEndpointNotificationCallback(IntPtr pClient);
    int UnregisterEndpointNotificationCallback(IntPtr pClient);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IMMDevice {
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.Interface)] out object ppInterface);
    int OpenPropertyStore(int stgmAccess, [MarshalAs(UnmanagedType.Interface)] out object ppProperties);
    int GetId([MarshalAs(UnmanagedType.LPWStr)] out string ppstrId);
    int GetState(out uint pdwState);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
[ClassInterface(ClassInterfaceType.None)]
class MMDeviceEnumeratorClass {}

public static class AudioHelper {
    public static string GetDefaultDeviceId() {
        var enumerator = (IMMDeviceEnumerator)new MMDeviceEnumeratorClass();
        IMMDevice device;
        enumerator.GetDefaultAudioEndpoint(0, 0, out device);
        string id;
        device.GetId(out id);
        return id;
    }
}
"@ -Language CSharp

Write-Output ([AudioHelper]::GetDefaultDeviceId())
`;

// PowerShell script template: set default render device
// Placeholder %%DEVICE_ID%% will be replaced at runtime
const SET_SCRIPT_TEMPLATE = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

[Guid("568B9108-44BF-40B4-9006-86AFE5B5A620")]
[InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
interface IPolicyConfigVista {
    int NotImpl1();
    int NotImpl2();
    int NotImpl3();
    int NotImpl4();
    int NotImpl5();
    int NotImpl6();
    int NotImpl7();
    int NotImpl8();
    int NotImpl9();
    int SetDefaultEndpoint([MarshalAs(UnmanagedType.LPWStr)] string deviceId, int eRole);
}

[ComImport]
[Guid("294935CE-F637-4E7C-A41B-AB255460B862")]
[ClassInterface(ClassInterfaceType.None)]
class CPolicyConfigClient {}

public static class AudioHelper {
    public static void SetDefault(string deviceId) {
        var policy = (IPolicyConfigVista)new CPolicyConfigClient();
        policy.SetDefaultEndpoint(deviceId, 0); // eConsole
        policy.SetDefaultEndpoint(deviceId, 1); // eMultimedia
        policy.SetDefaultEndpoint(deviceId, 2); // eCommunications
    }
}
"@ -Language CSharp

[AudioHelper]::SetDefault("%%DEVICE_ID%%")
`;

function runPsFile(scriptContent) {
  return new Promise((resolve, reject) => {
    const tmpFile = join(tmpdir(), `sso-${randomUUID()}.ps1`);
    writeFile(tmpFile, scriptContent, "utf-8")
      .then(() => {
        exec(
          `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File "${tmpFile}"`,
          { timeout: 15000 },
          (err, stdout, stderr) => {
            unlink(tmpFile).catch(() => {});
            if (err) return reject(new Error(stderr || err.message));
            resolve(stdout.trim());
          }
        );
      })
      .catch(reject);
  });
}

export async function getAudioDevices() {
  const raw = await runPsFile(ENUM_SCRIPT);
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse audio devices JSON: ${raw.slice(0, 100)}`);
  }
}

export async function getCurrentDevice() {
  const raw = await runPsFile(CURRENT_SCRIPT);
  if (!raw) throw new Error("getCurrentDevice returned empty output");
  return raw;
}

const DEVICE_ID_RE = /^\{[\w.-]+\}\.\{[\w-]+\}$/;

export async function setDefaultDevice(_event, deviceId) {
  if (!DEVICE_ID_RE.test(deviceId)) {
    throw new Error(`Invalid deviceId format: ${deviceId}`);
  }
  const script = SET_SCRIPT_TEMPLATE.replace("%%DEVICE_ID%%", deviceId);
  await runPsFile(script);
}
