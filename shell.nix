{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    nodejs_20
  ];

  shellHook = ''
    echo "Node.js verfügbar"
    node --version
    npm --version
  '';
}
