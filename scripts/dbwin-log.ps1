#Requires -Version 7.0
<#
.SYNOPSIS
Prints OutputDebugString output from a process, so Wh_Log lines can be watched
outside Windhawk's own log pane.

.DESCRIPTION
Windhawk writes Wh_Log lines with OutputDebugString. This script owns the DBWIN
shared-memory buffer (the same mechanism DebugView uses), waits for each line,
and prints it. Only one listener can own DBWIN at a time: close DebugView (or
any attached debugger) first.

The mod no longer writes a file log; this is the replacement for
`scripts\dev.ps1 log`.

.PARAMETER ProcessName
Process whose lines are printed. Defaults to windhawk-ui. Pass an empty string
to print every process on the machine.

.PARAMETER Seconds
Stop after this many seconds. 0 (the default) runs until Ctrl+C.

.PARAMETER ShowPid
Prefix every line with the source process id.

.EXAMPLE
pwsh -NoProfile -File scripts/dbwin-log.ps1
Watch windhawk-ui.exe until Ctrl+C.

.EXAMPLE
pwsh -NoProfile -File scripts/dbwin-log.ps1 -ProcessName windhawk -Seconds 20 -ShowPid
Capture the tray process for 20 seconds.
#>
[CmdletBinding()]
param(
    [Parameter(Position = 0)]
    [string]$ProcessName = 'windhawk-ui',

    [int]$Seconds = 0,

    [switch]$ShowPid
)

$ErrorActionPreference = 'Stop'

$source = @'
using System;
using System.Diagnostics;
using System.Globalization;
using System.IO.MemoryMappedFiles;
using System.Text;
using System.Threading;

public static class WhDbwinLog
{
    private static volatile bool s_stop;

    public static void Run(string processName, int seconds, bool showPid)
    {
        int onlyPid = 0;
        if (!string.IsNullOrWhiteSpace(processName))
        {
            Process[] processes;
            try
            {
                processes = Process.GetProcessesByName(processName);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine("dbwin: cannot look up '" + processName + "': " + ex.Message);
                return;
            }
            if (processes.Length == 0)
            {
                Console.Error.WriteLine("dbwin: no process named '" + processName + "'");
                return;
            }
            onlyPid = processes[0].Id;
        }

        Console.CancelKeyPress += (sender, args) =>
        {
            args.Cancel = true;
            s_stop = true;
        };

        Encoding encoding;
        try
        {
            Encoding.RegisterProvider(CodePagesEncodingProvider.Instance);
            encoding = Encoding.GetEncoding(CultureInfo.CurrentCulture.TextInfo.ANSICodePage);
        }
        catch
        {
            encoding = Encoding.Default;
        }

        try
        {
            using (MemoryMappedFile buffer = MemoryMappedFile.CreateNew("DBWIN_BUFFER", 4096))
            using (EventWaitHandle ready = new EventWaitHandle(false, EventResetMode.AutoReset, "DBWIN_BUFFER_READY"))
            using (EventWaitHandle dataReady = new EventWaitHandle(false, EventResetMode.AutoReset, "DBWIN_DATA_READY"))
            using (MemoryMappedViewAccessor view = buffer.CreateViewAccessor(0, 4096))
            {
                byte[] bytes = new byte[4092];
                DateTime deadline = seconds > 0 ? DateTime.UtcNow.AddSeconds(seconds) : DateTime.MaxValue;

                ready.Set();
                while (!s_stop && DateTime.UtcNow < deadline)
                {
                    if (!dataReady.WaitOne(250))
                    {
                        continue;
                    }

                    int pid = view.ReadInt32(0);
                    view.ReadArray(4, bytes, 0, bytes.Length);
                    int length = Array.IndexOf(bytes, (byte)0);
                    if (length < 0)
                    {
                        length = bytes.Length;
                    }

                    if (onlyPid != 0 && pid != onlyPid)
                    {
                        ready.Set();
                        continue;
                    }

                    string text = encoding.GetString(bytes, 0, length);
                    if (showPid)
                    {
                        Console.WriteLine("[" + pid + "] " + text);
                    }
                    else
                    {
                        Console.WriteLine(text);
                    }
                    ready.Set();
                }
            }
        }
        catch (UnauthorizedAccessException)
        {
            Console.Error.WriteLine("dbwin: DBWIN is already owned by another listener (DebugView or a debugger).");
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine("dbwin: " + ex.Message);
        }
    }
}
'@

Add-Type -TypeDefinition $source -Language CSharp
[WhDbwinLog]::Run($ProcessName, $Seconds, [bool]$ShowPid)
