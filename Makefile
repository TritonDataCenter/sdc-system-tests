#
# Copyright (c) 2014, Joyent, Inc. All rights reserved.
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

# Use sdc-smartos/1.6.3 builds, but don't really care because we use the 'gz'
# tag.
NODE_PREBUILT_IMAGE=fd2cc906-8938-11e3-beab-4359c665ac99
ifeq ($(shell uname -s),SunOS)
	NODE_PREBUILT_VERSION=v0.10.26
	NODE_PREBUILT_TAG=gz
else
	NPM	:= $(shell which npm)
endif


include ./tools/mk/Makefile.defs
ifeq ($(shell uname -s),SunOS)
	include ./tools/mk/Makefile.node_prebuilt.defs
endif


RELEASE_TARBALL	:= $(NAME)-$(STAMP).tgz
RELSTAGEDIR	:= /tmp/$(STAMP)
DISTCLEAN_FILES	+= node_modules



#
# Targets
#
.PHONY: all
all: | $(NPM_EXEC)
	$(NPM) install
	cd node_modules/sdc-clients && $(NPM) install

.PHONY: test
test:
	./runtests.sh

.PHONY: release
release:
	@echo "Building $(RELEASE_TARBALL)"
	rm -rf $(RELSTAGEDIR)
	mkdir -p $(RELSTAGEDIR)/$(NAME)-$(STAMP)
	cp -r \
		$(TOP)/README.md \
		$(TOP)/package.json \
		$(TOP)/runtests \
		$(TOP)/test \
		$(TOP)/node_modules \
		$(RELSTAGEDIR)/$(NAME)-$(STAMP)/
	mkdir -p $(RELSTAGEDIR)/$(NAME)-$(STAMP)/build
	cp -r \
		$(TOP)/build/node \
		$(RELSTAGEDIR)/$(NAME)-$(STAMP)/build
	(cd $(RELSTAGEDIR) && pwd && find .)
	(cd $(RELSTAGEDIR) && $(TAR) -czf $(TOP)/$(RELEASE_TARBALL) $(NAME)-$(STAMP))
	@rm -rf $(RELSTAGEDIR)

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
