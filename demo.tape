Output demo.gif

Set Shell "bash"
Set FontSize 14
Set FontFamily "Cascadia Code"
Set Width 740
Set Height 560
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 60ms

Env PATH "/Users/christianecg/dev/personal/avelor_vhost/bin:/Users/christianecg/.n/bin:/opt/homebrew/bin:/usr/bin:/bin"

Hide
Type "cd /tmp && rm -rf vhost-demo && mkdir vhost-demo && cd vhost-demo && clear"
Enter
Sleep 400ms
Show

Type "vhost init"
Enter
Sleep 1.2s

# avelor.com — interactivo
Type "vhost new avelor.com"
Enter
Sleep 800ms
Type "www.avelor.com"
Enter
Sleep 400ms
Type "1"
Enter
Sleep 400ms
Type "/home/avelor/avelor"
Enter
Sleep 400ms
Enter
Sleep 1.5s

# api.avelor.es — con flags, solo Enter en aliases y SSL
Type "vhost new api.avelor.es --mode proxy --port 3000"
Enter
Sleep 800ms
Enter
Sleep 400ms
Enter
Sleep 1.5s

# app.avelor.es — igual
Type "vhost new app.avelor.es --mode proxy --port 4000"
Enter
Sleep 800ms
Enter
Sleep 400ms
Enter
Sleep 1.5s

Type "cat sites.yml"
Enter
Sleep 1s

Sleep 3s
