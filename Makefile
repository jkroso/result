REPORTER=dot
INSTALL=packin install \
	--meta package.json,component.json,deps.json \
	--folder node_modules \
	--executables \
	--no-retrace

serve: node_modules
	@node_modules/serve/bin/serve

test: node_modules
	@node_modules/mocha/bin/_mocha test/index.js \
		--reporter $(REPORTER) \
		--timeout 500 \
		--check-leaks \
		--bail

node_modules: component.json
	@$(INSTALL)
	@cd node_modules/result-core && $(INSTALL)
	
clean:
	rm -r node_modules

.PHONY: clean serve test