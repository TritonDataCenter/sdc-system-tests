#
# Copyright (c) 2012, Joyent, Inc. All rights reserved.
#
# Makefile for sdc-system-tests
#

#
# Vars, Tools, Files, Flags
#
NAME		:= sdc-system-tests
JS_FILES	:= $(shell find test -name '*.js' | grep -v '/tmp/')
JSL_CONF_NODE	 = tools/jsl.node.conf
JSL_FILES_NODE	 = $(JS_FILES)
JSSTYLE_FILES	 = $(JS_FILES)
JSSTYLE_FLAGS	 = -f tools/jsstyle.conf

# Just want to use a node the same as the platform because usage of this
# package will be using /usr/node/bin/node.
ifeq ($(shell uname -s),SunOS)
	NODE_PREBUILT_VERSION=v0.8.8
	NODE_PREBUILT_TAG=zone
else
	NPM	:= $(shell which npm)
endif


include ./tools/mk/Makefile.defs
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.defs
endif


RELEASE_TARBALL	:= $(NAME)-$(STAMP).tgz
TMPDIR          := /tmp/$(STAMP)



#
# Targets
#
.PHONY: all
all: | $(NPM_EXEC)
	$(NPM) install && $(NPM) update
	cd node_modules/sdc-clients && $(NPM) install

.PHONY: test
test:
	./runtests.sh

.PHONY: release
release:
	@echo "Building $(RELEASE_TARBALL)"
	echo "TAR is $(TAR)"
	rm -rf $(TMPDIR)
	mkdir -p $(TMPDIR)/$(NAME)-$(STAMP)
	cp -r \
		$(TOP)/README.md \
		$(TOP)/package.json \
		$(TOP)/runtests \
		$(TOP)/test \
		$(TOP)/node_modules \
		$(TMPDIR)/$(NAME)-$(STAMP)/
	(cd $(TMPDIR) && pwd && find .)
	(cd $(TMPDIR) && $(TAR) -czf $(TOP)/$(RELEASE_TARBALL) $(NAME)-$(STAMP))
	@rm -rf $(TMPDIR)

.PHONY: publish
publish: release
	@if [[ -z "$(BITS_DIR)" ]]; then \
		@echo "error: 'BITS_DIR' must be set for 'publish' target"; \
		exit 1; \
	fi
	mkdir -p $(BITS_DIR)/$(NAME)
	cp $(TOP)/$(RELEASE_TARBALL) $(BITS_DIR)/$(NAME)/$(RELEASE_TARBALL)

.PHONY: dumpvar
dumpvar:
	@if [[ -z "$(VAR)" ]]; then \
		echo "error: set 'VAR' to dump a var"; \
		exit 1; \
	fi
	@echo "$(VAR) is '$($(VAR))'"


include ./tools/mk/Makefile.deps
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.targ
endif
include ./tools/mk/Makefile.targ
