# FROM centos:7
FROM python:2.7

# RUN yum update -y && yum install -y epel-release rpm-build rpmdevtools 
RUN apt update && apt install -y rpm sudo 

# RUN yum install -y sudo python3 openssh-clients

ARG USERNAME=eosdev
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    #
    # [Optional] Add sudo support. Omit if you don't need to install software after connecting.
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME

RUN echo "eosdev ALL=(ALL:ALL) NOPASSWD:ALL" >> /etc/sudoers && \
    echo "# macros"                      >  /home/eosdev/.rpmmacros && \
    echo "%_topdir    /workspaces/eos-html-intf/rpmbuild" >> /home/eosdev/.rpmmacros && \
    echo "%_sourcedir %{_topdir}/SOURCES"        >> /home/eosdev/.rpmmacros && \
    echo "%_builddir  %{_topdir}/BUILD"        >> /home/eosdev/.rpmmacros && \
    echo "%_specdir   %{_topdir}/SPECS"        >> /home/eosdev/.rpmmacros && \
    echo "%_rpmdir    %{_topdir}/RPM"        >> /home/eosdev/.rpmmacros && \
    echo "%_srcrpmdir %{_topdir}/SRPMS"        >> /home/eosdev/.rpmmacros && \
    mkdir /home/eosdev/rpmbuild && \
    chown -R eosdev /home/eosdev

RUN pip install jsonrpclib tornado python2-secrets

USER eosdev

ENV name='EosIntfGui'

