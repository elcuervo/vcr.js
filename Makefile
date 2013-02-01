NODE = node

all:
	rackup -DP rack.pid
	@$(NODE) test/*.js
	kill `cat rack.pid`
	rm rack.pid 
