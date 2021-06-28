rem 法一：https://www.jb51.net/article/15153.htm
Set WshShell=CreateObject("Wscript.Shell")
Wscript.Echo WshShell.SpecialFolders("AllUsersPrograms")

rem 法二：该解决方案仍然仅在CScript.exe下有效 https://qastack.cn/programming/4388879/vbscript-output-to-console
rem Set WshShell=CreateObject("Wscript.Shell")
rem Set fso = Wscript.CreateObject("Scripting.FileSystemObject")
rem Set stdout = fso.GetStandardStream(1)
rem Set stderr = fso.GetStandardStream(2)
rem stdout.WriteLine WshShell.SpecialFolders("AllUsersPrograms")


rem 一些shell-API文档 https://ss64.com/vb/shell.html