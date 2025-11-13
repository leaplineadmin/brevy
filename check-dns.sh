#!/bin/bash
echo "🔍 Vérification DNS pour les sous-domaines brevy.me"
echo ""
echo "Test 1: Résolution DNS d'un sous-domaine de test"
dig +short test123.brevy.me
echo ""
echo "Test 2: Vérification du CNAME wildcard"
dig +short test123.brevy.me CNAME
echo ""
echo "Test 3: Vérification avec nslookup"
nslookup test123.brevy.me
