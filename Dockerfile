FROM i386/centos:7

RUN yum update -y && yum install -y epel-release rpm-build rpmdevtools sudo
# RUN yum groupinstall -y "Development tools" "Server Platform Development" "Additional Development" "Compatibility libraries"

RUN useradd builder -u 1000 -m -G users,wheel && \
    echo "builder ALL=(ALL:ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    echo "# macros"                      >  /home/builder/.rpmmacros && \
    echo "%_topdir    /home/builder/rpmbuild" >> /home/builder/.rpmmacros && \
    echo "%_sourcedir %{_topdir}/SOURCES"        >> /home/builder/.rpmmacros && \
    echo "%_builddir  %{_topdir}/BUILD"        >> /home/builder/.rpmmacros && \
    echo "%_specdir   %{_topdir}/SPECS"        >> /home/builder/.rpmmacros && \
    echo "%_rpmdir    %{_topdir}/RPM"        >> /home/builder/.rpmmacros && \
    echo "%_srcrpmdir %{_topdir}/SRPMS"        >> /home/builder/.rpmmacros && \
    mkdir /home/builder/rpmbuild && \
    chown -R builder /home/builder

USER builder

WORKDIR /home/builder

RUN mkdir -p ~/rpmbuild/{BUILD,RPM,SOURCES,SPECS,SRPMS}

ENV name='EosIntfGui'

WORKDIR /home/builder/rpmbuild/SPECS

CMD rpmbuild -ba ${name}.spec
