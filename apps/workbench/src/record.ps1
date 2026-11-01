param([Parameter(Mandatory=$true)][string]$OutputPath, [Parameter(Mandatory=$true)][string]$StopPath)
$ErrorActionPreference = 'Stop'
# Explicitly started by the microphone button. No network, no system speech service.
Add-Type -TypeDefinition @'
using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Threading;
public static class CodechRecorder {
  [StructLayout(LayoutKind.Sequential)] struct Format { public ushort tag, channels; public uint rate, bytes; public ushort align, bits, size; }
  [StructLayout(LayoutKind.Sequential)] struct Header { public IntPtr data; public uint length, recorded; public UIntPtr user; public uint flags, loops; public IntPtr next; public UIntPtr reserved; }
  delegate void Callback(IntPtr handle, uint message, UIntPtr instance, IntPtr header, IntPtr unused);
  [DllImport("winmm.dll")] static extern uint waveInOpen(out IntPtr handle, uint device, ref Format format, Callback callback, UIntPtr instance, uint flags);
  [DllImport("winmm.dll")] static extern uint waveInPrepareHeader(IntPtr handle, IntPtr header, uint size);
  [DllImport("winmm.dll")] static extern uint waveInUnprepareHeader(IntPtr handle, IntPtr header, uint size);
  [DllImport("winmm.dll")] static extern uint waveInAddBuffer(IntPtr handle, IntPtr header, uint size);
  [DllImport("winmm.dll")] static extern uint waveInStart(IntPtr handle);
  [DllImport("winmm.dll")] static extern uint waveInReset(IntPtr handle);
  [DllImport("winmm.dll")] static extern uint waveInClose(IntPtr handle);
  static void Check(uint code) { if(code != 0) throw new Exception("Microphone error " + code + ". Check the default recording device and Windows microphone access."); }
  public static void Record(string output, string stop) {
    var format = new Format { tag=1, channels=1, rate=16000, bytes=32000, align=2, bits=16, size=0 };
    IntPtr handle=IntPtr.Zero; var headers=new IntPtr[4]; var buffers=new IntPtr[4]; int size=Marshal.SizeOf(typeof(Header)); bool running=true; object gate=new object(); Exception failure=null;
    using(var file=new FileStream(output,FileMode.CreateNew,FileAccess.ReadWrite,FileShare.None)) {
      file.Write(new byte[44],0,44);
      Callback callback = (h,message,instance,ptr,unused) => { if(message!=0x3C0) return; try { var header=(Header)Marshal.PtrToStructure(ptr,typeof(Header)); lock(gate){if(header.recorded>0){var data=new byte[header.recorded];Marshal.Copy(header.data,data,0,data.Length);file.Write(data,0,data.Length);}} if(running) Check(waveInAddBuffer(h,ptr,(uint)size)); } catch(Exception e){failure=e;running=false;} };
      try {
        Check(waveInOpen(out handle,0xFFFFFFFF,ref format,callback,UIntPtr.Zero,0x30000));
        for(int i=0;i<4;i++){buffers[i]=Marshal.AllocHGlobal(8192);headers[i]=Marshal.AllocHGlobal(size);Marshal.StructureToPtr(new Header{data=buffers[i],length=8192},headers[i],false);Check(waveInPrepareHeader(handle,headers[i],(uint)size));Check(waveInAddBuffer(handle,headers[i],(uint)size));}
        Check(waveInStart(handle)); Console.WriteLine("RECORDING"); Console.Out.Flush();
        var deadline=DateTime.UtcNow.AddSeconds(120);while(running&&!File.Exists(stop)&&DateTime.UtcNow<deadline)Thread.Sleep(60);
      } finally {
        running=false;if(handle!=IntPtr.Zero){waveInReset(handle);for(int i=0;i<4;i++)if(headers[i]!=IntPtr.Zero)waveInUnprepareHeader(handle,headers[i],(uint)size);waveInClose(handle);}
        for(int i=0;i<4;i++){if(headers[i]!=IntPtr.Zero)Marshal.FreeHGlobal(headers[i]);if(buffers[i]!=IntPtr.Zero)Marshal.FreeHGlobal(buffers[i]);}GC.KeepAlive(callback);
      }
      if(failure!=null)throw failure;
      int bytes=(int)file.Length-44;file.Position=0;using(var writer=new BinaryWriter(file)){writer.Write(System.Text.Encoding.ASCII.GetBytes("RIFF"));writer.Write(bytes+36);writer.Write(System.Text.Encoding.ASCII.GetBytes("WAVEfmt "));writer.Write(16);writer.Write((ushort)1);writer.Write((ushort)1);writer.Write(16000);writer.Write(32000);writer.Write((ushort)2);writer.Write((ushort)16);writer.Write(System.Text.Encoding.ASCII.GetBytes("data"));writer.Write(bytes);}
    }
  }
}
'@
[CodechRecorder]::Record($OutputPath, $StopPath)
