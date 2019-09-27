FROM centos:7.6.1810

RUN yum update -y && yum install -y epel-release rpm-build rpmdevtools && yum install -y python-pip && \
    yum groupinstall -y "Development tools" "Server Platform Development" "Additional Development" "Compatibility libraries"

RUN useradd builder -u 1000 -m -G users,wheel && \
    echo "builder ALL=(ALL:ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    echo "# macros"                      >  /home/builder/.rpmmacros && \
    echo "%_topdir    /home/builder/rpmbuild" >> /home/builder/.rpmmacros && \
    echo "%_sourcedir %{_topdir}/SOURCES"        >> /home/builder/.rpmmacros && \
    echo "%_builddir  %{_topdir}/BUILD"        >> /home/builder/.rpmmacros && \
    echo "%_specdir   %{_topdir}/SPECS"        >> /home/builder/.rpmmacros && \
    echo "%_rpmdir    %{_topdir}/RPM"        >> /home/builder/.rpmmacros && \
    echo "%_srcrpmdir %{_topdir}SRPMS"        >> /home/builder/.rpmmacros && \
    mkdir /home/builder/rpmbuild && \
    chown -R builder /home/builder

USER builder

WORKDIR /home/builder

RUN mkdir -p ~/rpmbuild/{BUILD,RPMS,SOURCES,SPECS,SRPMS}

ENV name='EosIntfGui' version='0.4' release='1'

COPY source tmp

RUN tar -C tmp -cvf rpmbuild/SOURCES/${name}-${version}-$release}.tar ./

COPY ${name}.spec rpmbuild/SPECS/

# RUN rpmbuild -v -ba ~/rpmbuild/SPECS/${name}.spec
